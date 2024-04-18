import { storage } from 'wxt/storage';

import { CoubExclusionReason } from '@/request/coub';
import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';
import { StorageBase } from '../base';
import type { StorageMeta } from '../types';

import { statsMigrations } from './migrations';
import type { StatsV4 as Stats } from './types';

export interface StatsMeta extends StorageMeta {}

interface FilteredOutCoub {
	reason: CoubExclusionReason;
}

export type ReadonlyStats = ToReadonly<Stats>;

const key = 'stats' as const;

const defaultValue: Stats = {
	filtered: Object.fromEntries(
		Object.values(CoubExclusionReason).map(reason => [reason, 0]),
	) as Stats['filtered'],
};

export const statsItem = storage.defineItem<Stats, StatsMeta>(`local:${key}`, {
	version: 4,
	defaultValue,
	migrations: statsMigrations,
});

export class StatsStorage extends StorageBase<typeof key, Stats, StatsMeta> {
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
		const newStats: Stats = { ...stats, filtered: { ...stats.filtered } };

		for (const { reason: _reason } of filtered) {
			newStats.filtered[_reason] = (newStats.filtered[_reason] || 0) + 1;
		}

		await this.setValue(newStats);
	}
}
