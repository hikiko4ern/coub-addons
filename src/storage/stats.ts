import { storage } from 'wxt/storage';

import { CoubExclusionReason } from '@/request/coub';
import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { StorageBase } from './base';
import type { StorageMeta } from './types';

type CoubExclusionReasonV1 =
	| CoubExclusionReason.COUB_DISLIKED
	| CoubExclusionReason.CHANNEL_BLOCKED;
type CoubExclusionReasonV2 = CoubExclusionReasonV1 | CoubExclusionReason.TAG_BLOCKED;
type CoubExclusionReasonV3 = CoubExclusionReasonV2 | CoubExclusionReason.COUB_TITLE_BLOCKED;

interface StatsV1 {
	filtered: Record<CoubExclusionReasonV1, number>;
}

interface StatsV2 {
	filtered: Record<CoubExclusionReasonV2, number>;
}

interface StatsV3 {
	filtered: Record<CoubExclusionReasonV3, number>;
}

export interface StatsMeta extends StorageMeta {}

interface FilteredOutCoub {
	reason: CoubExclusionReason;
}

export type ReadonlyStats = ToReadonly<StatsV3>;

const key = 'stats' as const;

const defaultValue: StatsV3 = {
	filtered: Object.fromEntries(
		Object.values(CoubExclusionReason).map(reason => [reason, 0]),
	) as StatsV3['filtered'],
};

export const statsItem = storage.defineItem<StatsV3, StatsMeta>(`local:${key}`, {
	version: 3,
	defaultValue,
	migrations: {
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
	},
});

export class StatsStorage extends StorageBase<typeof key, StatsV3, StatsMeta> {
	static readonly KEY = key;
	protected readonly logger: Logger;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger(new.target.name);
		super(tabId, source, childLogger, new.target.KEY, statsItem);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}

	async countFilteredOutCoubs(filtered: readonly Readonly<FilteredOutCoub>[]) {
		if (!filtered.length) {
			return;
		}

		const stats = await this.getValue();
		const newStats: StatsV3 = { ...stats, filtered: { ...stats.filtered } };

		for (const { reason: _reason } of filtered) {
			newStats.filtered[_reason] = (newStats.filtered[_reason] || 0) + 1;
		}

		await this.setValue(newStats);
	}
}
