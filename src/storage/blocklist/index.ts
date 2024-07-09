import { storage } from 'wxt/storage';

import { isPromise } from '@/helpers/isPromise';
import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { StorageBase } from '../base';
import type { StorageMeta } from '../types';
import { blocklistMigrations } from './migrations';
import type { BlocklistV2 as Blocklist } from './types';

export type { Blocklist };

export interface BlocklistMeta extends StorageMeta {}

export type ReadonlyBlocklist = ToReadonly<Blocklist>;

const key = 'blocklist' as const;

const defaultValue: Blocklist = {
	isBlockRecoubs: false,
	isHideCommentsFromBlockedChannels: true,
};

export const blocklistItem = storage.defineItem<Blocklist, BlocklistMeta>(`local:${key}`, {
	version: 2,
	defaultValue,
	migrations: blocklistMigrations,
});

export class BlocklistStorage extends StorageBase<typeof key, Blocklist, BlocklistMeta> {
	static readonly KEY = key;
	static readonly META_KEY = `${key}$` as const;
	protected readonly logger: Logger;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger(new.target.name);
		super(tabId, source, childLogger, new.target.KEY, blocklistItem);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}

	isHideCommentsFromBlockedChannels = () => {
		const current = this.getValue();
		return isPromise(current)
			? current.then(c => c.isHideCommentsFromBlockedChannels)
			: current.isHideCommentsFromBlockedChannels;
	};

	mergeWith = async (value: Partial<Blocklist>) => {
		const current = await this.getValue();
		return this.setValue({ ...current, ...value });
	};
}
