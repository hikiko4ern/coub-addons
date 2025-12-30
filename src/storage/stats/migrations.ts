import { ChannelExclusionReason } from '@/request/types/channel';
import { CommentHandlingReason } from '@/request/types/comment';
import { CoubExclusionReason } from '@/request/types/coub';
import { StoryExclusionReason } from '@/request/types/story';

import type { DefineMigrations } from '../migrations';
import type { statsVersion } from './index';
import type {
	StatsV1,
	StatsV2,
	StatsV3,
	StatsV4,
	StatsV5,
	StatsV6,
	StatsV7,
	StatsV8,
	StatsV9,
} from './types';

type Migrations = DefineMigrations<
	typeof statsVersion,
	[StatsV1, StatsV2, StatsV3, StatsV4, StatsV5, StatsV6, StatsV7, StatsV8, StatsV9]
>;

export const statsMigrations: Migrations = {
	2: (stats): StatsV2 => ({
		...stats,
		filtered: {
			...stats.filtered,
			[CoubExclusionReason.TAG_BLOCKED]: 0,
		},
	}),

	3: (stats): StatsV3 => ({
		...stats,
		filtered: {
			...stats.filtered,
			[CoubExclusionReason.COUB_TITLE_BLOCKED]: 0,
		},
	}),

	4: (stats): StatsV4 => ({
		...stats,
		filtered: {
			...stats.filtered,
			[CoubExclusionReason.RECOUBS_BLOCKED]: 0,
		},
	}),

	5: (stats): StatsV5 => ({
		...stats,
		filteredCoubs: stats.filtered,
		filteredComments: {
			[CommentHandlingReason.CHANNEL_BLOCKED]: 0,
		},
	}),

	6: (stats): StatsV6 => ({
		...stats,
		filteredStories: {
			[StoryExclusionReason.CHANNEL_BLOCKED]: 0,
		},
	}),

	7: (stats): StatsV7 => ({
		...stats,
		filteredStories: {
			...stats.filteredStories,
			[StoryExclusionReason.REPOSTS_BLOCKED]: 0,
		},
	}),

	8: (stats): StatsV8 => ({
		...stats,
		filteredCoubs: {
			...stats.filteredCoubs,
			[CoubExclusionReason.REPOSTS_BLOCKED]: 0,
		},
	}),

	9: (stats): StatsV9 => ({
		...stats,
		filteredChannels: {
			[ChannelExclusionReason.BLOCKED]: 0,
		},
	}),
};
