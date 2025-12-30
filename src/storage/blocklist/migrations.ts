import type { DefineMigrations } from '../migrations';
import type { blocklistVersion } from './index';
import {
	type BlocklistV1,
	type BlocklistV2,
	type BlocklistV3,
	type BlocklistV4,
	type BlocklistV5,
	CommentFromBlockedChannelActionV5,
} from './types';

type Migrations = DefineMigrations<
	typeof blocklistVersion,
	[BlocklistV1, BlocklistV2, BlocklistV3, BlocklistV4, BlocklistV5]
>;

export const blocklistMigrations: Migrations = {
	2: (blocklist): BlocklistV2 => ({
		...blocklist,
		isHideCommentsFromBlockedChannels: true,
	}),

	3: (blocklist): BlocklistV3 => ({
		...blocklist,
		isBlockRepostsOfStories: false,
	}),

	4: (blocklist): BlocklistV4 => ({
		...blocklist,
		isBlockRepostsOfCoubs: false,
	}),

	5: (blocklist): BlocklistV5 => ({
		...blocklist,
		commentsFromBlockedChannels: blocklist.isHideCommentsFromBlockedChannels
			? CommentFromBlockedChannelActionV5.RemoveWithReplies
			: CommentFromBlockedChannelActionV5.Show,
	}),
};
