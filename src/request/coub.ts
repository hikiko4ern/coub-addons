import { imap } from 'itertools';

import type { Channel } from '@/api/types';
import type { CommentFieldsFragment } from '@/gql/comments/graphql';
import { isObject } from '@/helpers/isObject';
import type { IsChannelBlockedFn } from '@/storage/blockedChannels';
import type { IsCoubBlockedByTitle } from '@/storage/blockedCoubTitles';
import type { IsHaveBlockedTagsFn } from '@/storage/blockedTags';
import type { ReadonlyBlocklist } from '@/storage/blocklist';
import { Logger } from '@/utils/logger';
import type { Context } from './ctx';
import type { TimelineResponseCoub } from './timeline';
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
	COUB_TITLE_BLOCKED = 'coub-title-is-blocked',
	RECOUBS_BLOCKED = 'recoubs-are-blocked',
}

export enum CommentExclusionReason {
	CHANNEL_BLOCKED = 'channel-is-blocked',
}

export interface FilteredOutCoubForStats {
	channelPermalink: string | undefined;
	reason: CoubExclusionReason;
}

const logger = Logger.create('CoubHelpers');
const CHANNEL_TIMELINE_PREFIX = '/api/v2/timeline/channel/';

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

	getCountedInStatsTimelineRequestCoubs = <F extends FilteredOutCoubForStats>(
		details: RequestDetails,
		filtered: F[],
	): F[] => {
		try {
			const url = new URL(details.url);

			if (url.origin === this.#ctx.origin && url.pathname.startsWith(CHANNEL_TIMELINE_PREFIX)) {
				const channelPermalink = url.pathname.slice(CHANNEL_TIMELINE_PREFIX.length);

				return filtered.filter(
					f =>
						f.reason !== CoubExclusionReason.CHANNEL_BLOCKED ||
						f.channelPermalink !== channelPermalink,
				);
			}
		} catch (err) {
			logger.error('failed to check if request should be counted in stats', details, err);
		}

		return filtered;
	};
}

class CoubBlocklistChecker {
	readonly #isChannelBlocked: IsChannelBlockedFn;
	readonly #isHaveBlockedTags: IsHaveBlockedTagsFn;
	readonly #isBlockedByTitle: IsCoubBlockedByTitle;
	readonly #blocklist: ReadonlyBlocklist;

	private constructor(
		isChannelBlocked: IsChannelBlockedFn,
		isHaveBlockedTags: IsHaveBlockedTagsFn,
		isHaveBlockedCoubTitles: IsCoubBlockedByTitle,
		blocklist: ReadonlyBlocklist,
	) {
		this.#isChannelBlocked = isChannelBlocked;
		this.#isHaveBlockedTags = isHaveBlockedTags;
		this.#isBlockedByTitle = isHaveBlockedCoubTitles;
		this.#blocklist = blocklist;
	}

	static async create(ctx: Context) {
		return new CoubBlocklistChecker(
			...(await Promise.all([
				ctx.blockedChannels.createBoundedIsBlocked(),
				ctx.blockedTags.createBoundedIsBlocked(),
				ctx.blockedCoubTitles.createBoundedIsBlocked(),
				ctx.blocklist.getValue(),
			])),
		);
	}

	isExcludeFromTimeline = (
		coub: TimelineResponseCoub,
	):
		| [isExclude: true, reason: Exclude<CoubExclusionReason, CoubExclusionReason.TAG_BLOCKED>]
		| [isExclude: true, reason: CoubExclusionReason.TAG_BLOCKED, blockedByPattern: string]
		| [isExclude: true, reason: CoubExclusionReason.COUB_TITLE_BLOCKED, blockedByPattern: string]
		| [isExclude: false] => {
		if (!isObject(coub) || coub.like === true || coub.favourite === true) {
			return [false];
		}

		if (coub.dislike === true) {
			return [true, CoubExclusionReason.COUB_DISLIKED];
		}

		if (
			this.#blocklist.isBlockRecoubs &&
			isObject(coub.media_blocks) &&
			Array.isArray(coub.media_blocks.remixed_from_coubs) &&
			coub.media_blocks.remixed_from_coubs.length
		) {
			return [true, CoubExclusionReason.RECOUBS_BLOCKED];
		}

		if (
			isObject(coub.channel) &&
			typeof coub.channel.id === 'number' &&
			this.#isChannelBlocked(coub.channel.id)
		) {
			return [true, CoubExclusionReason.CHANNEL_BLOCKED];
		}

		let blockedByPattern: string | undefined;

		if (typeof coub.title === 'string' && (blockedByPattern = this.#isBlockedByTitle(coub.title))) {
			return [true, CoubExclusionReason.COUB_TITLE_BLOCKED, blockedByPattern];
		}

		if (
			Array.isArray(coub.tags) &&
			isObject(coub.tags[0]) &&
			'title' in coub.tags[0] &&
			typeof coub.tags[0].title === 'string' &&
			(blockedByPattern = this.#isHaveBlockedTags(imap(coub.tags, tag => tag.title)))
		) {
			return [true, CoubExclusionReason.TAG_BLOCKED, blockedByPattern];
		}

		return [false];
	};

	isExcludeComment = (
		comment: CommentFieldsFragment,
	): [isExclude: true, reason: CommentExclusionReason] | [isExclude: false] => {
		if (!isObject(comment)) {
			return [false];
		}

		if (isObject(comment.author) && typeof comment.author.coubcomChannelId === 'string') {
			const channelId = Number.parseInt(comment.author.coubcomChannelId);

			if (!Number.isNaN(channelId) && this.#isChannelBlocked(channelId)) {
				return [true, CommentExclusionReason.CHANNEL_BLOCKED];
			}
		}

		return [false];
	};
}
