import { BlockedChannelsStorage } from '@/storage/blockedChannels';
import { StatsStorage } from '@/storage/stats';

import { logger } from '../constants';
import { tabId } from './useTabId';

interface Storages {
	readonly blockedChannelsStorage: BlockedChannelsStorage;
	readonly statsStorage: StatsStorage;
}

let blockedChannelsStorage: BlockedChannelsStorage, statsStorage: StatsStorage;

const lazyStorageLoader = Object.defineProperties<Storages>(Object.create(null), {
	blockedChannelsStorage: {
		configurable: false,
		get: () => (blockedChannelsStorage ||= new BlockedChannelsStorage(tabId, 'options', logger)),
	},
	statsStorage: {
		configurable: false,
		get: () => (statsStorage ||= new StatsStorage(tabId, 'options', logger)),
	},
});

export const useLazyStorages = () => lazyStorageLoader;
