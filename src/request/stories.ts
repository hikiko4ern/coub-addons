import { is } from 'superstruct';

import { Channel } from '@/api/types';
import { isObject } from '@/helpers/isObject';
import { getStoryPermalink } from '@/helpers/story/getStoryPermalink';
import { type StoryTitleData, getStoryTitleData } from '@/helpers/story/getStoryTitleData';
import { toJsonDataUri } from '@/helpers/toJsonDataUri';
import { matchChannelTimeline } from '@/helpers/url/matchChannelTimeline';
import { parseSearchPage } from '@/helpers/url/parseSearchPage';
import type { BlockedChannelData } from '@/storage/blockedChannels';
import type { Context } from './ctx';
import { type FilteredOutStoryForStats, StoryExclusionReason } from './types/story';

interface StoriesResponse {
	page: number;
	total_pages: number;
	per_page: number;
	stories: StoriesResponseStory[];
}

export interface StoriesResponseStory {
	/** title of the story */
	title: string;
	/** story's unique view link */
	permalink: string;
	/** story's tags */
	tags: StoriesResponseTag[];
	/** story's author */
	channel: Channel;
	/** is story reposted? */
	is_repost: boolean;
	/** the author of the story post (for reposts only) */
	post_channel?: Channel;
}

interface StoriesResponseTag {
	id: number;
	/** displayed tag name */
	title: string;
	/** {@link title} encoded as a URI component */
	value: string;
}

interface FilteredOutStory extends StoryTitleData, FilteredOutStoryForStats {
	tReason: string;
	link: string;
}

const EXCLUSION_REASON_TEXT: Record<StoryExclusionReason, string> = {
	[StoryExclusionReason.CHANNEL_BLOCKED]: 'author is blocked manually',
	[StoryExclusionReason.REPOSTS_BLOCKED]: 'reposts are blocked',
};

export const registerStoriesHandlers = (ctx: Context) => {
	ctx.webRequest.rewriteCompleteJsonResponse<StoriesResponse>({
		name: 'stories handler',
		filter: {
			urls: [
				'/api/v2/stories',
				'/api/v2/stories?*',
				'/api/v2/stories/featured',
				'/api/v2/stories/featured?*',
				'/api/v2/stories/suggestions',
				'/api/v2/stories/suggestions?*',
				// to match URLs only with the `type=stories` search param,
				// and not the `someText_type=stories`
				'/api/v2/timeline/channel/*?type=stories',
				'/api/v2/timeline/channel/*?type=stories&*',
				'/api/v2/timeline/channel/*?*&type=stories',
				'/api/v2/timeline/channel/*?*&type=stories&*',
			],
			types: ['xmlhttprequest'],
		},
		onBeforeRequest: async ({ ctx, logger, details }) => {
			const url = new URL(details.url);
			const match = matchChannelTimeline(url.pathname);

			if (
				// biome-ignore lint/complexity/useOptionalChain: `match` can be `false`
				match &&
				match.params.permalink &&
				(await ctx.blockedChannels.isBlockedPermalink(match.params.permalink))
			) {
				const page = parseSearchPage(url.searchParams.get('page')) || 1;
				const perPage = parseSearchPage(url.searchParams.get('per_page')) || 10;

				const data: StoriesResponse = {
					page,
					total_pages: page - 1,
					per_page: perPage,
					stories: [],
				};

				logger.debug('redirecting', details.url, 'to', data);

				return { redirectUrl: toJsonDataUri(data) };
			}
		},
		rewrite: async ({ ctx, logger, details, data }) => {
			let isModified = false;

			if (isObject(data) && Array.isArray(data.stories)) {
				ctx.blockedChannels
					.actualizeChannelsData(iterAsBlockedChannels(data.stories))
					.catch((err: unknown) => logger.error('failed to actualize blocked channels data', err));

				const origAmount = data.stories.length;

				const filteredStories: (typeof data)['stories'] = [];
				const filteredOutStories: FilteredOutStory[] = [];

				const checker = await ctx.blocklistUtils.createChecker();

				for (const story of data.stories) {
					const [isExclude, reason] = checker.isExcludeStory(story);

					if (isExclude) {
						filteredOutStories.push({
							...getStoryTitleData(story),
							channelPermalink: story.channel?.permalink,
							reason,
							tReason: EXCLUSION_REASON_TEXT[reason],
							link: getStoryPermalink(story.permalink).toString(),
						});
						continue;
					}

					filteredStories.push(story);
				}

				data.stories = filteredStories;
				isModified = filteredStories.length !== origAmount;

				if (filteredOutStories.length) {
					logger.groupCollapsed(
						'filtered out',
						filteredOutStories.length,
						filteredOutStories.length > 1 ? 'stories' : 'story',
					);
					logger.tableRaw(filteredOutStories, ['title', 'author', 'tReason', 'link']);
					logger.groupEnd();

					ctx.stats.countFilteredOutStories(details.url, details.originUrl, filteredOutStories);
				}

				logger.debug(
					'processed',
					origAmount,
					origAmount > 1 ? 'stories,' : 'story,',
					'returning',
					isModified ? filteredStories.length : 'all',
					'of them',
				);
			}

			if (isModified) {
				return data;
			}
		},
	});
};

function* iterAsBlockedChannels(
	stories: Iterable<StoriesResponseStory>,
): Generator<BlockedChannelData, void, never> {
	for (const story of stories) {
		if (isObject(story)) {
			if (is(story.channel, Channel)) {
				yield {
					id: story.channel.id,
					title: story.channel.title,
					permalink: story.channel.permalink,
				};
			}
		}
	}
}
