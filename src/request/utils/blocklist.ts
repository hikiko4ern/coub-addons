import { imap } from 'itertools';

import type { CommentFieldsFragment } from '@/gql/comments/graphql';
import { isObject } from '@/helpers/isObject';
import type { IsChannelBlockedFn } from '@/storage/blockedChannels';
import type { IsCoubBlockedByTitle } from '@/storage/blockedCoubTitles';
import type { IsHaveBlockedTagsFn } from '@/storage/blockedTags';
import type { ReadonlyBlocklist } from '@/storage/blocklist';

import type { MatchedBlocklistPhrase } from '@/storage/phrasesBlocklist/types';
import type { Context } from '../ctx';
import type { StoriesResponseStory } from '../stories';
import type { TimelineResponseCoub } from '../timeline';
import { CommentExclusionReason } from '../types/comment';
import { CoubExclusionReason } from '../types/coub';
import { StoryExclusionReason } from '../types/story';

export class BlocklistUtils {
	readonly #ctx: Context;

	constructor(ctx: Context) {
		this.#ctx = ctx;
	}

	createChecker = async () => BlocklistChecker.create(this.#ctx);
}

class BlocklistChecker {
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
		return new BlocklistChecker(
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
		| [
				isExclude: true,
				excludedCoub: TimelineResponseCoub,
				reason: Exclude<CoubExclusionReason, CoubExclusionReason.TAG_BLOCKED>,
		  ]
		| [
				isExclude: true,
				excludedCoub: TimelineResponseCoub,
				reason: CoubExclusionReason.TAG_BLOCKED,
				blockedByPattern: string,
		  ]
		| [
				isExclude: true,
				excludedCoub: TimelineResponseCoub,
				reason: CoubExclusionReason.COUB_TITLE_BLOCKED,
				blockedByPattern: string,
		  ]
		| [isExclude: false] => {
		if (!isObject(coub) || coub.like === true || coub.favourite === true) {
			return [false];
		}

		if (
			isObject(coub.channel) &&
			typeof coub.channel.id === 'number' &&
			this.#isChannelBlocked(coub.channel.id)
		) {
			return [true, coub, CoubExclusionReason.CHANNEL_BLOCKED];
		}

		if (coub.recoub_to != null) {
			if (this.#blocklist.isBlockRepostsOfCoubs) {
				return [true, coub, CoubExclusionReason.REPOSTS_BLOCKED];
			}

			return this.isExcludeFromTimeline(coub.recoub_to);
		}

		if (coub.dislike === true) {
			return [true, coub, CoubExclusionReason.COUB_DISLIKED];
		}

		if (
			this.#blocklist.isBlockRecoubs &&
			isObject(coub.media_blocks) &&
			Array.isArray(coub.media_blocks.remixed_from_coubs) &&
			coub.media_blocks.remixed_from_coubs.length
		) {
			return [true, coub, CoubExclusionReason.RECOUBS_BLOCKED];
		}

		let blockedByPattern: MatchedBlocklistPhrase | undefined;

		if (typeof coub.title === 'string' && (blockedByPattern = this.#isBlockedByTitle(coub.title))) {
			return [true, coub, CoubExclusionReason.COUB_TITLE_BLOCKED, blockedByPattern[0]];
		}

		if (
			Array.isArray(coub.tags) &&
			isObject(coub.tags[0]) &&
			'title' in coub.tags[0] &&
			typeof coub.tags[0].title === 'string' &&
			(blockedByPattern = this.#isHaveBlockedTags(imap(coub.tags, tag => tag.title)))
		) {
			return [true, coub, CoubExclusionReason.TAG_BLOCKED, blockedByPattern[0]];
		}

		return [false];
	};

	isExcludeStory = (
		story: StoriesResponseStory,
	): [isExclude: true, reason: StoryExclusionReason] | [isExclude: false] => {
		if (!isObject(story)) {
			return [false];
		}

		if (
			isObject(story.channel) &&
			typeof story.channel.id === 'number' &&
			this.#isChannelBlocked(story.channel.id)
		) {
			return [true, StoryExclusionReason.CHANNEL_BLOCKED];
		}

		if (this.#blocklist.isBlockRepostsOfStories && story.is_repost === true) {
			return [true, StoryExclusionReason.REPOSTS_BLOCKED];
		}

		return [false];
	};

	isExcludeComment = (
		comment: CommentFieldsFragment,
	): [isExclude: true, reason: CommentExclusionReason] | [isExclude: false] => {
		if (!isObject(comment)) {
			return [false];
		}

		if (isObject(comment.author) && typeof comment.author.channelId === 'string') {
			const channelId = Number.parseInt(comment.author.channelId, 10);

			if (!Number.isNaN(channelId) && this.#isChannelBlocked(channelId)) {
				return [true, CommentExclusionReason.CHANNEL_BLOCKED];
			}
		}

		return [false];
	};
}
