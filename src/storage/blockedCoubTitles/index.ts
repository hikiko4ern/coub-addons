import { storage } from 'wxt/storage';

import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { PhrasesBlocklistStorage } from '../phrasesBlocklist';
import type { StorageMeta, StorageSyncMeta } from '../types';
import { blockedCoubTitlesMigrations } from './migrations';
import type { BlockedCoubTitles, RawBlockedCoubTitles } from './types';

export type { IsBlockedFn as IsCoubBlockedByTitle } from '../phrasesBlocklist';
export type {
	BlockedCoubTitles,
	RawBlockedCoubTitles,
} from './types';

export interface BlockedCoubTitlesMeta extends StorageMeta, StorageSyncMeta {}

export type ReadonlyBlockedCoubTitles = ToReadonly<BlockedCoubTitles>;

const key = 'blockedCoubTitles' as const,
	metaKey = `${key}$` as const;

export const blockedCoubTitlesVersion = 1;

const fallbackValue: RawBlockedCoubTitles = '';

const blockedCoubTitlesItem = storage.defineItem<RawBlockedCoubTitles, BlockedCoubTitlesMeta>(
	`local:${key}`,
	{
		version: blockedCoubTitlesVersion,
		fallback: fallbackValue,
		migrations: blockedCoubTitlesMigrations,
	},
);

export class BlockedCoubTitlesStorage extends PhrasesBlocklistStorage<typeof key, typeof metaKey> {
	static readonly KEY = key;
	static readonly META_KEY = metaKey;
	static readonly STORAGE = blockedCoubTitlesItem;
	static readonly MIGRATIONS = undefined;
	protected readonly logger: Logger;
	protected readonly version = blockedCoubTitlesVersion;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger('BlockedCoubTitlesStorage');
		super(tabId, source, childLogger, new.target.KEY, new.target.META_KEY, new.target.STORAGE);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}
}
