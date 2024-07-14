import type { ConditionalKeys } from 'type-fest';
import { storage } from 'wxt/storage';

import { CommentExclusionReason } from '@/request/types/comment';
import { CoubExclusionReason } from '@/request/types/coub';
import { StoryExclusionReason } from '@/request/types/story';
import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { StorageBase } from '../base';
import type { StorageMeta } from '../types';
import {
	type FilteredOutData,
	getCountedInStatsFilteredOutData,
} from './helpers/getCountedInStatsFilteredOutData';
import { statsMigrations } from './migrations';
import type { StatsV7 as Stats } from './types';

export interface StatsMeta extends StorageMeta {}

export type ReadonlyStats = ToReadonly<Stats>;

const key = 'stats' as const;

const defaultValue: Stats = {
	filteredCoubs: Object.fromEntries(
		Object.values(CoubExclusionReason).map(reason => [reason, 0]),
	) as Stats['filteredCoubs'],
	filteredStories: Object.fromEntries(
		Object.values(StoryExclusionReason).map(reason => [reason, 0]),
	) as Stats['filteredStories'],
	filteredComments: Object.fromEntries(
		Object.values(CommentExclusionReason).map(reason => [reason, 0]),
	) as Stats['filteredComments'],
};

export const statsItem = storage.defineItem<Stats, StatsMeta>(`local:${key}`, {
	version: 7,
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

		this.countFilteredOutCoubs = this.countFilteredOutCoubs.bind(this);
		this.countFilteredOutStories = this.countFilteredOutStories.bind(this);
		this.countFilteredOutComments = this.countFilteredOutComments.bind(this);
	}

	countFilteredOutCoubs = createCountFilteredOut(
		'coubs',
		'filteredCoubs',
		CoubExclusionReason.CHANNEL_BLOCKED,
	);

	countFilteredOutStories = createCountFilteredOut(
		'stories',
		'filteredStories',
		StoryExclusionReason.CHANNEL_BLOCKED,
	);

	countFilteredOutComments = createCountFilteredOut(
		'comments',
		'filteredComments',
		CommentExclusionReason.CHANNEL_BLOCKED,
	);
}

const createCountFilteredOut = <Key extends ConditionalKeys<Stats, Record<string, number>>>(
	name: string,
	statsKey: Key,
	channelBlockedReason: keyof Stats[Key],
) =>
	async function countFilteredOut(
		this: InstanceType<typeof StatsStorage>,
		requestUrl: string,
		originUrl: string | undefined,
		filteredOut: readonly Readonly<FilteredOutData<keyof Stats[Key]>>[],
	) {
		if (!filteredOut.length) {
			return;
		}

		const counted = getCountedInStatsFilteredOutData({
			name,
			logger: this.logger,
			channelBlockedReason,
			requestUrl,
			originUrl,
			filteredOut,
		});

		if (!counted.length) {
			return;
		}

		const stats = await this.getValue();
		const newStats: Stats = { ...stats, [statsKey]: { ...stats[statsKey] } };
		const newStatsFiltered = newStats[statsKey] as Record<keyof Stats[Key], number>;

		for (const { reason } of filteredOut) {
			newStatsFiltered[reason] = (newStatsFiltered[reason] || 0) + 1;
		}

		await this.setValue(newStats);
	};
