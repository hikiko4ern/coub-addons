import { isObject } from '@/helpers/isObject';
import { CoubExclusionReason, type CoubTitleData, type FilteredOutCoubForStats } from './coub';
import type { Context } from './ctx';
import type { Channel } from './types';

interface TimelineResponse {
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
	tags: TimelineResponseCoubTag[];
	/** "media blocks" like sources or original coubs */
	media_blocks: TimelineResponseCoubMediaBlocks;
}

interface TimelineResponseCoubTag {
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
	ctx.webRequest.rewriteCompleteJsonResponse<TimelineResponse>({
		filter: {
			urls: ['/api/v2/timeline', '/api/v2/timeline?*', '/api/v2/timeline/*'],
			types: ['xmlhttprequest'],
		},
		isHandleRequest: ({ details }) => {
			const { pathname } = new URL(details.url);
			switch (pathname) {
				case '/api/v2/timeline/likes':
					return [false, 'likes timeline'];

				case '/api/v2/timeline/favourites':
					return [false, 'bookmarks timeline'];

				default:
					return [true];
			}
		},
		rewrite: async ({ details, data, logger }) => {
			let isModified = false;

			if (isObject(data) && Array.isArray(data.coubs)) {
				const origAmount = data.coubs.length;

				const filteredCoubs: (typeof data)['coubs'] = [];
				const filteredOutCoubs: FilteredOutCoub[] = [];

				const checker = await ctx.coubHelpers.createChecker();

				for (const coub of data.coubs) {
					const [isExclude, reason, blockedByPattern] = checker.isExcludeFromTimeline(coub);

					if (isExclude) {
						filteredOutCoubs.push({
							...ctx.coubHelpers.getCoubTitleData(coub),
							channelPermalink: coub.channel?.permalink,
							reason,
							tReason: EXCLUSION_REASON_TEXT[reason],
							pattern: blockedByPattern,
							link: ctx.coubHelpers.getCoubPermalink(coub.permalink).toString(),
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

					ctx.stats.countFilteredOutCoubs(
						ctx.coubHelpers.getCountedInStatsTimelineRequestCoubs(details, filteredOutCoubs),
					);
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
