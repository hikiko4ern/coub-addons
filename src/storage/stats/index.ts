import type { ConditionalKeys } from 'type-fest';
import { storage } from 'wxt/storage';

import { CommentExclusionReason, CoubExclusionReason } from '@/request/coub';
import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { StorageBase } from '../base';
import type { StorageMeta } from '../types';
import { statsMigrations } from './migrations';
import type { StatsV5 as Stats } from './types';

export interface StatsMeta extends StorageMeta {}

interface FilteredOutCoub {
	reason: CoubExclusionReason;
}

interface FilteredOutComment {
	reason: CommentExclusionReason;
}

export type ReadonlyStats = ToReadonly<Stats>;

const key = 'stats' as const;

const defaultValue: Stats = {
	filteredCoubs: Object.fromEntries(
		Object.values(CoubExclusionReason).map(reason => [reason, 0]),
	) as Stats['filteredCoubs'],
	filteredComments: Object.fromEntries(
		Object.values(CommentExclusionReason).map(reason => [reason, 0]),
	) as Stats['filteredComments'],
};

export const statsItem = storage.defineItem<Stats, StatsMeta>(`local:${key}`, {
	version: 5,
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

	countFilteredOutCoubs(filtered: readonly Readonly<FilteredOutCoub>[]) {
		return this.countFilteredOut('filteredCoubs', filtered);
	}

	countFilteredOutComments(filtered: readonly Readonly<FilteredOutComment>[]) {
		return this.countFilteredOut('filteredComments', filtered);
	}

	private async countFilteredOut<Key extends ConditionalKeys<Stats, Record<string, number>>>(
		key: Key,
		filtered: readonly Readonly<{ reason: keyof Stats[Key] }>[],
	) {
		if (!filtered.length) {
			return;
		}

		const stats = await this.getValue();
		const newStats: Stats = { ...stats, [key]: { ...stats[key] } };
		const newStatsFiltered = newStats[key] as Record<keyof Stats[Key], number>;

		for (const { reason } of filtered) {
			newStatsFiltered[reason] = (newStatsFiltered[reason] || 0) + 1;
		}

		await this.setValue(newStats);
	}
}
