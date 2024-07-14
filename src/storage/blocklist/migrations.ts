import type { BlocklistV1, BlocklistV2, BlocklistV3 } from './types';

// biome-ignore lint/suspicious/noExplicitAny:
type Migrations = Record<2 | 3, (blocklist: any) => unknown>;

export const blocklistMigrations: Migrations = {
	2: (blocklist: BlocklistV1): BlocklistV2 => ({
		...blocklist,
		isHideCommentsFromBlockedChannels: true,
	}),
	3: (blocklist: BlocklistV2): BlocklistV3 => ({
		...blocklist,
		isBlockRepostsOfStories: false,
	}),
};
