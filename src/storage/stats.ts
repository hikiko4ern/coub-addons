import { CoubExclusionReason } from '@/request/coub';
import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { StorageBase } from './base';
import type { StorageMeta } from './types';

type CoubExclusionReasonV1 =
	| CoubExclusionReason.COUB_DISLIKED
	| CoubExclusionReason.CHANNEL_BLOCKED;

interface StatsV1 {
	filtered: Record<CoubExclusionReasonV1, number>;
}

interface StatsV2 {
	filtered: Record<CoubExclusionReasonV1 | CoubExclusionReason.TAG_BLOCKED, number>;
}

export interface StatsMeta extends StorageMeta {}

interface FilteredOutCoub {
	reason: CoubExclusionReason;
}

export type ReadonlyStats = ToReadonly<StatsV2>;

const key = 'stats' as const;

const defaultValue: StatsV2 = {
	filtered: Object.fromEntries(
		Object.values(CoubExclusionReason).map(reason => [reason, 0]),
	) as StatsV2['filtered'],
};

export const statsItem = storage.defineItem<StatsV2, StatsMeta>(`local:${key}`, {
	version: 2,
	defaultValue,
	migrations: {
		2: (stats: StatsV1): StatsV2 => ({
			...stats,
			filtered: {
				...stats.filtered,
				[CoubExclusionReason.TAG_BLOCKED]: 0,
			},
		}),
	},
});

export class StatsStorage extends StorageBase<typeof key, StatsV2, StatsMeta> {
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
		const newStats: StatsV2 = { ...stats, filtered: { ...stats.filtered } };

		for (const { reason: _reason } of filtered) {
			newStats.filtered[_reason] = (newStats.filtered[_reason] || 0) + 1;
		}

		await this.setValue(newStats);
	}
}
