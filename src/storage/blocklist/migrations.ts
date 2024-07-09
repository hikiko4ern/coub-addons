import type { BlocklistV1, BlocklistV2 } from './types';

// biome-ignore lint/suspicious/noExplicitAny:
type Migrations = Record<2, (blocklist: any) => unknown>;

export const blocklistMigrations: Migrations = {
	2: (blocklist: BlocklistV1): BlocklistV2 => ({
		...blocklist,
		isHideCommentsFromBlockedChannels: true,
	}),
};
