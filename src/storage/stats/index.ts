import type { ConditionalKeys } from 'type-fest';
import { storage } from 'wxt/storage';

import { ChannelExclusionReason } from '@/request/types/channel';
import { CommentHandlingReason } from '@/request/types/comment';
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
import type { StatsV9 as Stats } from './types';

export interface StatsMeta extends StorageMeta {}

export type ReadonlyStats = ToReadonly<Stats>;

const key = 'stats' as const,
	metaKey = `${key}$` as const,
	version = 9;

const fallbackValue: Stats = {
	filteredChannels: Object.fromEntries(
		Object.values(ChannelExclusionReason).map(reason => [reason, 0]),
	) as Stats['filteredChannels'],
	filteredCoubs: Object.fromEntries(
		Object.values(CoubExclusionReason).map(reason => [reason, 0]),
	) as Stats['filteredCoubs'],
	filteredStories: Object.fromEntries(
		Object.values(StoryExclusionReason).map(reason => [reason, 0]),
	) as Stats['filteredStories'],
	filteredComments: Object.fromEntries(
		Object.values(CommentHandlingReason).map(reason => [reason, 0]),
	) as Stats['filteredComments'],
};

const statsItem = storage.defineItem<Stats, StatsMeta>(`local:${key}`, {
	version,
	fallback: fallbackValue,
	migrations: statsMigrations,
});

export class StatsStorage extends StorageBase<typeof key, typeof metaKey, Stats, StatsMeta> {
	static readonly KEY = key;
	static readonly META_KEY = metaKey;
	static readonly STORAGE = statsItem;
	static readonly MIGRATIONS = statsMigrations;
	protected readonly logger: Logger;
	protected readonly version = version;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger('StatsStorage');
		super(tabId, source, childLogger, new.target.KEY, new.target.META_KEY, new.target.STORAGE);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;

		this.countFilteredOutCoubs = this.countFilteredOutCoubs.bind(this);
		this.countFilteredOutStories = this.countFilteredOutStories.bind(this);
		this.countHandledComments = this.countHandledComments.bind(this);
	}

	countFilteredOutChannels = createCountFilteredOut(
		'channels',
		'filteredChannels',
		ChannelExclusionReason.BLOCKED,
	);

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

	countHandledComments = createCountFilteredOut(
		'comments',
		'filteredComments',
		CommentHandlingReason.CHANNEL_BLOCKED,
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
