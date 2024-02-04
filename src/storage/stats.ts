import { CoubExclusionReason } from '@/request/coub';
import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { StorageBase } from './base';

interface Stats {
	filtered: Record<CoubExclusionReason, number>;
}

interface FilteredOutCoub {
	_reason: CoubExclusionReason;
}

export type ReadonlyStats = ToReadonly<Stats>;

const key = 'stats' as const;

const defaultValue: Stats = {
	filtered: Object.fromEntries(
		Object.values(CoubExclusionReason).map(reason => [reason, 0]),
	) as Stats['filtered'],
};

const statsItem = storage.defineItem<Stats>(`local:${key}`, {
	version: 1,
	defaultValue,
});

export class StatsStorage extends StorageBase<typeof key, Stats> {
	protected readonly key = key;
	protected readonly logger: Logger;
	protected readonly defaultValue = defaultValue;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger(new.target.name);
		super(tabId, source, childLogger, statsItem);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}

	async countFilteredOutCoubs(filtered: readonly Readonly<FilteredOutCoub>[]) {
		if (!filtered.length) {
			return;
		}

		const stats = await this.getValue();
		const newStats: Stats = { ...stats, filtered: { ...stats.filtered } };

		for (const { _reason } of filtered) {
			newStats.filtered[_reason] = (newStats.filtered[_reason] || 0) + 1;
		}

		await this.setValue(newStats);
	}
}
