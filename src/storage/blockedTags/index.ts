import { storage } from 'wxt/storage';

import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { PhrasesBlocklistStorage } from '../phrasesBlocklist';
import type { StorageMeta, StorageSyncMeta } from '../types';
import { blockedTagsMigrations } from './migrations';
import type { BlockedTags, RawBlockedTags } from './types';

export type { IsBlockedFn as IsHaveBlockedTagsFn } from '../phrasesBlocklist';
export type { BlockedTags, RawBlockedTags } from './types';

export interface BlockedTagsMeta extends StorageMeta, StorageSyncMeta {}

export type ReadonlyBlockedTags = ToReadonly<BlockedTags>;

const key = 'blockedTags' as const,
	metaKey = `${key}$` as const;

export const blockedTagsVersion = 1;

const fallbackValue: RawBlockedTags = '';

const blockedTagsItem = storage.defineItem<RawBlockedTags, BlockedTagsMeta>(`local:${key}`, {
	version: blockedTagsVersion,
	fallback: fallbackValue,
	migrations: blockedTagsMigrations,
});

export class BlockedTagsStorage extends PhrasesBlocklistStorage<typeof key, typeof metaKey> {
	static readonly KEY = key;
	static readonly META_KEY = metaKey;
	static readonly STORAGE = blockedTagsItem;
	static readonly MIGRATIONS = undefined;
	protected readonly logger: Logger;
	protected readonly version = blockedTagsVersion;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger('BlockedTagsStorage');
		super(tabId, source, childLogger, new.target.KEY, new.target.META_KEY, new.target.STORAGE);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}
}
