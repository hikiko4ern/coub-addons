import { CoubExclusionReason, type CoubTitleData } from './coub';
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
}

interface FilteredOutCoub extends CoubTitleData {
	link: string;
	reason: string;
	_reason: CoubExclusionReason;
}

const EXCLUSION_REASON_TEXT: Record<CoubExclusionReason, string> = {
	[CoubExclusionReason.COUB_DISLIKED]: 'coub is disliked',
	[CoubExclusionReason.CHANNEL_BLOCKED]: 'author is blocked manually',
};

export const registerTimelineHandlers = (ctx: Context) => {
	ctx.webRequest.rewriteCompleteJsonResponse(
		{
			urls: ['/api/v2/timeline', '/api/v2/timeline?*', '/api/v2/timeline/*'],
			types: ['xmlhttprequest'],
		},
		data => JSON.parse(data) as TimelineResponse,
		async ({ details, data, logger }) => {
			let isModified = false;

			if (typeof data === 'object' && data !== null && Array.isArray(data.coubs)) {
				const origAmount = data.coubs.length;

				const filteredCoubs: (typeof data)['coubs'] = [];
				const filteredOutCoubs: FilteredOutCoub[] = [];

				for (const coub of data.coubs) {
					const [isExclude, reason] = await ctx.coubHelpers.isExcludeFromTimeline(coub);

					if (isExclude) {
						filteredOutCoubs.push({
							...ctx.coubHelpers.getCoubTitleData(coub),
							reason: EXCLUSION_REASON_TEXT[reason],
							link: ctx.coubHelpers.getCoubPermalink(coub.permalink).toString(),
							_reason: reason,
						});
						continue;
					}

					filteredCoubs.push(coub);
				}

				data.coubs = filteredCoubs;
				isModified = filteredCoubs.length !== origAmount;

				if (filteredOutCoubs.length) {
					logger.groupCollapsed('filtered out', filteredOutCoubs.length, 'coubs');
					logger.tableRaw(filteredOutCoubs, ['title', 'author', 'link', 'reason']);
					logger.groupEnd();

					ctx.coubHelpers.isCountTimelineRequestInStats(details) &&
						ctx.stats.countFilteredOutCoubs(filteredOutCoubs);
				}

				logger.debug(
					'processed',
					origAmount,
					'coubs, returning',
					isModified ? filteredCoubs.length : 'all',
					'of them',
				);
			}

			if (isModified) {
				return data;
			}
		},
	);
};
