import { Logger } from '@/utils/logger';

import type { Context } from './ctx';
import type { TimelineResponseCoub } from './timeline';
import type { Channel } from './types';
import type { RequestDetails } from './webRequestExt';

interface CoubDataForTitle {
	/** title of the coub */
	title: string;

	/** coub's author */
	channel: Channel;
}

export interface CoubTitleData {
	/** title of the coub */
	title: string;
	/** coub's author */
	author: string | number | undefined;
}

export enum CoubExclusionReason {
	COUB_DISLIKED = 'coub-is-disliked',
	CHANNEL_BLOCKED = 'channel-is-blocked',
}

const logger = Logger.create('CoubHelpers');

export class CoubHelpers {
	readonly #ctx: Context;

	constructor(ctx: Context) {
		this.#ctx = ctx;
	}

	getCoubTitleData = ({ title, channel }: CoubDataForTitle): CoubTitleData => ({
		title,
		author: channel?.title || channel?.id,
	});

	getCoubPermalink = (permalink: string) => new URL(`/view/${permalink}`, this.#ctx.origin);

	isExcludeFromTimeline = async (
		coub: TimelineResponseCoub,
	): Promise<[isExclude: true, reason: CoubExclusionReason] | [isExclude: false]> => {
		if (typeof coub === 'object' && coub !== null) {
			if (coub.like === true || coub.favourite === true) {
				return [false];
			}

			if (coub.dislike === true) {
				return [true, CoubExclusionReason.COUB_DISLIKED];
			}

			if (
				typeof coub.channel === 'object' &&
				coub.channel !== null &&
				typeof coub.channel.id === 'number' &&
				(await this.#ctx.blockedChannels.isBlocked(coub.channel.id))
			) {
				return [true, CoubExclusionReason.CHANNEL_BLOCKED];
			}
		}

		return [false];
	};

	isCountTimelineRequestInStats = (details: RequestDetails) => {
		try {
			const url = new URL(details.url);

			if (url.origin === this.#ctx.origin && url.pathname.startsWith('/api/v2/timeline/channel/')) {
				return false;
			}
		} catch (err) {
			logger.error('failed to check if request should be counted in stats', details, err);
		}

		return true;
	};
}
