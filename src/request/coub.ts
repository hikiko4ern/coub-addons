import { imap } from 'itertools';

import type { IsChannelBlockedFn } from '@/storage/blockedChannels';
import type { IsHaveBlockedTagsFn } from '@/storage/blockedTags';
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
	TAG_BLOCKED = 'tag-is-blocked',
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

	createChecker = async () => CoubBlocklistChecker.create(this.#ctx);

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

class CoubBlocklistChecker {
	readonly #isChannelBlocked: IsChannelBlockedFn;
	readonly #isHaveBlockedTags: IsHaveBlockedTagsFn;

	private constructor(
		isChannelBlocked: IsChannelBlockedFn,
		isHaveBlockedTags: IsHaveBlockedTagsFn,
	) {
		this.#isChannelBlocked = isChannelBlocked;
		this.#isHaveBlockedTags = isHaveBlockedTags;
	}

	static async create(ctx: Context) {
		return new CoubBlocklistChecker(
			...(await Promise.all([
				ctx.blockedChannels.createBoundedIsBlocked(),
				ctx.blockedTags.createBoundedIsBlocked(),
			])),
		);
	}

	isExcludeFromTimeline = (
		coub: TimelineResponseCoub,
	):
		| [isExclude: true, reason: Exclude<CoubExclusionReason, CoubExclusionReason.TAG_BLOCKED>]
		| [isExclude: true, reason: CoubExclusionReason.TAG_BLOCKED, blockedByPattern: string]
		| [isExclude: false] => {
		if (
			coub == null ||
			typeof coub !== 'object' ||
			Array.isArray(coub) ||
			coub.like === true ||
			coub.favourite === true
		) {
			return [false];
		}

		if (coub.dislike === true) {
			return [true, CoubExclusionReason.COUB_DISLIKED];
		}

		if (
			coub.channel != null &&
			typeof coub.channel === 'object' &&
			typeof coub.channel.id === 'number' &&
			this.#isChannelBlocked(coub.channel.id)
		) {
			return [true, CoubExclusionReason.CHANNEL_BLOCKED];
		}

		let blockedByPattern: string | undefined;

		if (
			Array.isArray(coub.tags) &&
			coub.tags[0] != null &&
			typeof coub.tags[0] === 'object' &&
			!Array.isArray(coub.tags[0]) &&
			'title' in coub.tags[0] &&
			typeof coub.tags[0].title === 'string' &&
			(blockedByPattern = this.#isHaveBlockedTags(imap(coub.tags, tag => tag.title)))
		) {
			return [true, CoubExclusionReason.TAG_BLOCKED, blockedByPattern];
		}

		return [false];
	};
}
