import { is } from 'superstruct';

import { Channel } from '@/api/types';
import { getCoubPermalink } from '@/helpers/coub/getCoubPermalink';
import { type CoubTitleData, getCoubTitleData } from '@/helpers/coub/getCoubTitleData';
import { isObject } from '@/helpers/isObject';
import { toJsonDataUri } from '@/helpers/toJsonDataUri';
import { matchChannelTimeline } from '@/helpers/url/matchChannelTimeline';
import { parseSearchPage } from '@/helpers/url/parseSearchPage';
import type { BlockedChannelData } from '@/storage/blockedChannels';
import type { Context } from './ctx';
import { CoubExclusionReason, type FilteredOutCoubForStats } from './types/coub';

interface TimelineResponseCoubs {
	page: number;
	total_pages: number;
	per_page: number;
	coubs: TimelineResponseCoub[];
}

export interface TimelineResponseCoub {
	/** title of the coub */
	title: string;
	/** coub's unique view link */
	permalink: string;
	/** is coub liked by the current user? */
	like: boolean;
	/** is coub added to bookmarks by the current user? */
	favourite: boolean;
	/** is coub disliked by the current user? */
	dislike: boolean;
	/** coub's author */
	channel: Channel;
	/** coub's tags */
	tags: TimelineResponseTag[];
	/** "media blocks" like sources or original coubs */
	media_blocks: TimelineResponseCoubMediaBlocks;
}

interface TimelineResponseTag {
	id: number;
	/** displayed tag name */
	title: string;
	/** {@link title} encoded as a URI component */
	value: string;
}

interface TimelineResponseCoubMediaBlocks {
	/** original coubs for recoubs and remixes */
	remixed_from_coubs: unknown[];
}

interface FilteredOutCoub extends CoubTitleData, FilteredOutCoubForStats {
	tReason: string;
	pattern: string | undefined;
	link: string;
}

const EXCLUSION_REASON_TEXT: Record<CoubExclusionReason, string> = {
	[CoubExclusionReason.COUB_DISLIKED]: 'coub is disliked',
	[CoubExclusionReason.CHANNEL_BLOCKED]: 'author is blocked manually',
	[CoubExclusionReason.TAG_BLOCKED]: 'tag is blocked',
	[CoubExclusionReason.COUB_TITLE_BLOCKED]: "blocked by coub's title",
	[CoubExclusionReason.RECOUBS_BLOCKED]: 'recoubs are blocked',
};

export const registerTimelineHandlers = (ctx: Context) => {
	ctx.webRequest.rewriteCompleteJsonResponse<
		TimelineResponseCoubs,
		{ detailsUrl: URL; isLikesTimeline: boolean }
	>({
		name: 'timeline handler',
		filter: {
			urls: ['/api/v2/timeline', '/api/v2/timeline?*', '/api/v2/timeline/*'],
			types: ['xmlhttprequest'],
		},
		onBeforeRequest: async reqCtx => {
			const { ctx, logger, details } = reqCtx;

			const url = (reqCtx.detailsUrl = new URL(details.url));
			const type = url.searchParams.get('type');

			switch (type) {
				// don't handle the stories, `registerStoriesHandlers` will do that
				case 'stories': {
					logger.debug('ignoring stories request');
					return {};
				}

				case 'likes': {
					reqCtx.isLikesTimeline = true;
					return;
				}
			}

			const match = matchChannelTimeline(url.pathname);

			if (
				// biome-ignore lint/complexity/useOptionalChain: `match` can be `false`
				match &&
				match.params.permalink &&
				(await ctx.blockedChannels.isBlockedPermalink(match.params.permalink))
			) {
				const page = parseSearchPage(url.searchParams.get('page')) || 1;
				const perPage = parseSearchPage(url.searchParams.get('per_page')) || 10;

				const data: TimelineResponseCoubs = {
					page,
					total_pages: page - 1,
					per_page: perPage,
					coubs: [],
				};

				logger.debug('redirecting', details.url, 'to', data);

				return { redirectUrl: toJsonDataUri(data) };
			}
		},
		rewrite: async ({ ctx, logger, details, data, detailsUrl, isLikesTimeline }) => {
			let isModified = false;

			if (isObject(data) && Array.isArray(data.coubs)) {
				ctx.blockedChannels
					.actualizeChannelsData(iterAsBlockedChannels(data.coubs))
					.catch((err: unknown) => logger.error('failed to actualize blocked channels data', err));

				try {
					if (isLikesTimeline) {
						logger.debug('ignoring channel likes timeline response');
						return;
					}

					switch (detailsUrl?.pathname) {
						case '/api/v2/timeline/likes': {
							logger.debug('ignoring likes timeline response');
							return;
						}

						case '/api/v2/timeline/favourites': {
							logger.debug('ignoring bookmarks timeline response');
							return;
						}
					}
				} catch (err) {
					logger.error('failed to check timeline request URL', err);
				}

				const origAmount = data.coubs.length;

				const filteredCoubs: (typeof data)['coubs'] = [];
				const filteredOutCoubs: FilteredOutCoub[] = [];

				const checker = await ctx.blocklistUtils.createChecker();

				for (const coub of data.coubs) {
					const [isExclude, reason, blockedByPattern] = checker.isExcludeFromTimeline(coub);

					if (isExclude) {
						filteredOutCoubs.push({
							...getCoubTitleData(coub),
							channelPermalink: coub.channel?.permalink,
							reason,
							tReason: EXCLUSION_REASON_TEXT[reason],
							pattern: blockedByPattern,
							link: getCoubPermalink(coub.permalink).toString(),
						});
						continue;
					}

					filteredCoubs.push(coub);
				}

				data.coubs = filteredCoubs;
				isModified = filteredCoubs.length !== origAmount;

				if (filteredOutCoubs.length) {
					logger.groupCollapsed(
						'filtered out',
						filteredOutCoubs.length,
						filteredOutCoubs.length > 1 ? 'coubs' : 'coub',
					);
					logger.tableRaw(filteredOutCoubs, ['title', 'author', 'tReason', 'pattern', 'link']);
					logger.groupEnd();

					ctx.stats.countFilteredOutCoubs(details.url, details.originUrl, filteredOutCoubs);
				}

				logger.debug(
					'processed',
					origAmount,
					origAmount > 1 ? 'coubs,' : 'coub,',
					'returning',
					isModified ? filteredCoubs.length : 'all',
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
	coubs: Iterable<TimelineResponseCoub>,
): Generator<BlockedChannelData, void, never> {
	for (const coub of coubs) {
		if (is(coub.channel, Channel)) {
			yield {
				id: coub.channel.id,
				title: coub.channel.title,
				permalink: coub.channel.permalink,
			};
		}
	}
}
