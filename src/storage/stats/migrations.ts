import { CommentExclusionReason } from '@/request/types/comment';
import { CoubExclusionReason } from '@/request/types/coub';
import { StoryExclusionReason } from '@/request/types/story';
import type { StatsV1, StatsV2, StatsV3, StatsV4, StatsV5, StatsV6 } from './types';

// biome-ignore lint/suspicious/noExplicitAny:
type Migrations = Record<2 | 3 | 4 | 5 | 6, (stats: any) => unknown>;

export const statsMigrations: Migrations = {
	2: (stats: StatsV1): StatsV2 => ({
		...stats,
		filtered: {
			...stats.filtered,
			[CoubExclusionReason.TAG_BLOCKED]: 0,
		},
	}),
	3: (stats: StatsV2): StatsV3 => ({
		...stats,
		filtered: {
			...stats.filtered,
			[CoubExclusionReason.COUB_TITLE_BLOCKED]: 0,
		},
	}),
	4: (stats: StatsV3): StatsV4 => ({
		...stats,
		filtered: {
			...stats.filtered,
			[CoubExclusionReason.RECOUBS_BLOCKED]: 0,
		},
	}),
	5: (stats: StatsV4): StatsV5 => ({
		...stats,
		filteredCoubs: stats.filtered,
		filteredComments: {
			[CommentExclusionReason.CHANNEL_BLOCKED]: 0,
		},
	}),
	6: (stats: StatsV5): StatsV6 => ({
		...stats,
		filteredStories: {
			[StoryExclusionReason.CHANNEL_BLOCKED]: 0,
		},
	}),
};
