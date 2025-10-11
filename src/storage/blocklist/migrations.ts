import {
	type BlocklistV1,
	type BlocklistV2,
	type BlocklistV3,
	type BlocklistV4,
	type BlocklistV5,
	CommentFromBlockedChannelActionV5,
} from './types';

// biome-ignore lint/suspicious/noExplicitAny: old state is untyped
type Migrations = Record<2 | 3 | 4 | 5, (blocklist: any) => unknown>;

export const blocklistMigrations: Migrations = {
	2: (blocklist: BlocklistV1): BlocklistV2 => ({
		...blocklist,
		isHideCommentsFromBlockedChannels: true,
	}),
	3: (blocklist: BlocklistV2): BlocklistV3 => ({
		...blocklist,
		isBlockRepostsOfStories: false,
	}),
	4: (blocklist: BlocklistV3): BlocklistV4 => ({
		...blocklist,
		isBlockRepostsOfCoubs: false,
	}),
	5: (blocklist: BlocklistV4): BlocklistV5 => ({
		...blocklist,
		commentsFromBlockedChannels: blocklist.isHideCommentsFromBlockedChannels
			? CommentFromBlockedChannelActionV5.RemoveWithReplies
			: CommentFromBlockedChannelActionV5.Show,
	}),
};
