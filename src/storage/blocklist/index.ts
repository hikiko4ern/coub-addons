import { storage } from 'wxt/storage';

import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { StorageBase } from '../base';
import type { StorageMeta } from '../types';
import { blocklistMigrations } from './migrations';
import {
	type BlocklistV5 as Blocklist,
	CommentFromBlockedChannelActionV5 as CommentFromBlockedChannelAction,
} from './types';

export { CommentFromBlockedChannelAction };
export type { Blocklist };

export interface BlocklistMeta extends StorageMeta {}

export type ReadonlyBlocklist = ToReadonly<Blocklist>;

const key = 'blocklist' as const;

const fallbackValue: Blocklist = {
	isBlockRecoubs: false,
	isBlockRepostsOfCoubs: false,
	isBlockRepostsOfStories: false,
	commentsFromBlockedChannels: CommentFromBlockedChannelAction.HideMessage,
};

const blocklistItem = storage.defineItem<Blocklist, BlocklistMeta>(`local:${key}`, {
	version: 5,
	fallback: fallbackValue,
	migrations: blocklistMigrations,
});

export class BlocklistStorage extends StorageBase<typeof key, Blocklist, BlocklistMeta> {
	static readonly KEY = key;
	static readonly META_KEY = `${key}$` as const;
	static readonly STORAGE = blocklistItem;
	static readonly MIGRATIONS = blocklistMigrations;
	protected readonly logger: Logger;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger(new.target.name);
		super(tabId, source, childLogger, new.target.KEY, new.target.STORAGE);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}

	commentsFromBlockedChannelsAction = async () => {
		const value = await this.getValue();
		return value.commentsFromBlockedChannels;
	};

	mergeWith = async (value: Partial<Blocklist>) => {
		const current = await this.getValue();
		return this.setValue({ ...current, ...value });
	};

	static readonly merge = (current: Blocklist, backup: Partial<Blocklist>): Blocklist =>
		Object.assign(current, backup);
}
