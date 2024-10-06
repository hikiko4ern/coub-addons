import { storage } from 'wxt/storage';

import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { PhrasesBlocklistStorage } from '../phrasesBlocklist';
import type { StorageMeta } from '../types';
import type { BlockedCoubTitles, RawBlockedCoubTitles } from './types';

export type { IsBlockedFn as IsCoubBlockedByTitle } from '../phrasesBlocklist';
export type {
	BlockedCoubTitles,
	RawBlockedCoubTitles,
} from './types';

export interface BlockedCoubTitlesMeta extends StorageMeta {}

export type ReadonlyBlockedCoubTitles = ToReadonly<BlockedCoubTitles>;

const key = 'blockedCoubTitles' as const;

const fallbackValue: RawBlockedCoubTitles = '';

const blockedCoubTitlesItem = storage.defineItem<RawBlockedCoubTitles, BlockedCoubTitlesMeta>(
	`local:${key}`,
	{
		version: 1,
		fallback: fallbackValue,
	},
);

export class BlockedCoubTitlesStorage extends PhrasesBlocklistStorage<typeof key> {
	static readonly KEY = key;
	static readonly META_KEY = `${key}$` as const;
	static readonly STORAGE = blockedCoubTitlesItem;
	static readonly MIGRATIONS = undefined;
	protected readonly logger: Logger;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger(new.target.name);
		super(tabId, source, childLogger, new.target.KEY, new.target.STORAGE);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}
}
