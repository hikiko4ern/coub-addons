import { match } from 'path-to-regexp';

import { matchChannelTimeline } from '@/helpers/url/matchChannelTimeline';
import type { Logger } from '@/utils/logger';

const matchChannelPage = match<{ permalink: string }>('/:permalink', { sensitive: true });

export interface FilteredOutData<Reason> {
	channelPermalink?: string | undefined;
	reason: Reason;
}

interface Options<Reason, F extends FilteredOutData<Reason>> {
	name: string;
	logger: Logger;
	channelBlockedReason: NoInfer<Reason>;
	requestUrl: string;
	originUrl: string | undefined;
	filteredOut: readonly Readonly<F>[];
}

export const getCountedInStatsFilteredOutData = <Reason, F extends FilteredOutData<Reason>>({
	name,
	logger,
	channelBlockedReason,
	requestUrl: requestUrlStr,
	originUrl: originUrlStr,
	filteredOut,
}: Options<Reason, F>) => {
	try {
		const requestUrl = new URL(requestUrlStr);
		const originUrl = originUrlStr && new URL(originUrlStr);

		let timelineChannelPermalink: string | undefined, channelPagePermalink: string | undefined;

		if (requestUrl.origin === import.meta.env.VITE_COUB_ORIGIN) {
			const timelineMatch = matchChannelTimeline(requestUrl.pathname);
			timelineMatch && (timelineChannelPermalink = timelineMatch.params.permalink);

			const channelPageMatch =
				originUrl &&
				originUrl.origin === import.meta.env.VITE_COUB_ORIGIN &&
				matchChannelPage(originUrl.pathname);
			channelPageMatch && (channelPagePermalink = channelPageMatch.params.permalink);

			if (timelineChannelPermalink || channelPagePermalink) {
				using filterLogger = logger.scopedGroupAuto('filtering filtered out', name);

				filterLogger.debugRaw({
					requestUrl,
					originUrl,
					timelineChannelPermalink,
					channelPagePermalink,
					filtered: filteredOut,
				});

				return filteredOut.filter(f => {
					if (!f.channelPermalink || f.reason !== channelBlockedReason) {
						return true;
					}

					if (f.channelPermalink === timelineChannelPermalink) {
						filterLogger.debugRaw(f.channelPermalink, "matches timeline's permalink");
						return false;
					}

					if (f.channelPermalink === channelPagePermalink) {
						filterLogger.debugRaw(f.channelPermalink, "matches origin page's channel");
						return false;
					}

					return true;
				});
			}
		}
	} catch (err) {
		logger.error('failed to check if request should be counted in stats', requestUrlStr, err);
	}

	return filteredOut;
};
