import { BlockedChannelsStorage } from '@/storage/blockedChannels';
import { BlockedTagsStorage } from '@/storage/blockedTags';
import { StatsStorage } from '@/storage/stats';

import { logger } from '../constants';
import { tabId } from './useTabId';

interface Storages {
	readonly blockedChannelsStorage: BlockedChannelsStorage;
	readonly blockedTagsStorage: BlockedTagsStorage;
	readonly statsStorage: StatsStorage;
}

let blockedChannelsStorage: BlockedChannelsStorage,
	blockedTagsStorage: BlockedTagsStorage,
	statsStorage: StatsStorage;

const lazyStorages = Object.defineProperties<Storages>(Object.create(null), {
	blockedChannelsStorage: {
		configurable: false,
		get: () => (blockedChannelsStorage ||= new BlockedChannelsStorage(tabId, 'options', logger)),
	},
	blockedTagsStorage: {
		configurable: false,
		get: () => (blockedTagsStorage ||= new BlockedTagsStorage(tabId, 'options', logger)),
	},
	statsStorage: {
		configurable: false,
		get: () => (statsStorage ||= new StatsStorage(tabId, 'options', logger)),
	},
});

export const useLazyStorages = () => lazyStorages;
