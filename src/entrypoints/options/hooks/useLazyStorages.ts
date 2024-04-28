import { BlockedChannelsStorage } from '@/storage/blockedChannels';
import { BlockedCoubTitlesStorage } from '@/storage/blockedCoubTitles';
import { BlockedTagsStorage } from '@/storage/blockedTags';
import { BlocklistStorage } from '@/storage/blocklist';
import { PlayerSettingsStorage } from '@/storage/playerSettings';
import { SettingsStorage } from '@/storage/settings';
import { StatsStorage } from '@/storage/stats';

import { logger } from '../constants';
import { tabId } from './useTabId';

interface Storages {
	readonly blockedChannelsStorage: BlockedChannelsStorage;
	readonly blockedTagsStorage: BlockedTagsStorage;
	readonly blockedCoubTitlesStorage: BlockedCoubTitlesStorage;
	readonly blocklistStorage: BlocklistStorage;
	readonly playerSettingsStorage: PlayerSettingsStorage;
	readonly statsStorage: StatsStorage;
	readonly settingsStorage: SettingsStorage;
}

let blockedChannelsStorage: BlockedChannelsStorage,
	blockedTagsStorage: BlockedTagsStorage,
	blockedCoubTitlesStorage: BlockedCoubTitlesStorage,
	blocklistStorage: BlocklistStorage,
	playerSettingsStorage: PlayerSettingsStorage,
	statsStorage: StatsStorage,
	settingsStorage: SettingsStorage;

const lazyStorages = Object.defineProperties<Storages>(Object.create(null), {
	blockedChannelsStorage: {
		configurable: false,
		get: () => (blockedChannelsStorage ||= new BlockedChannelsStorage(tabId, 'options', logger)),
	},
	blockedTagsStorage: {
		configurable: false,
		get: () => (blockedTagsStorage ||= new BlockedTagsStorage(tabId, 'options', logger)),
	},
	blockedCoubTitlesStorage: {
		configurable: false,
		get: () =>
			(blockedCoubTitlesStorage ||= new BlockedCoubTitlesStorage(tabId, 'options', logger)),
	},
	blocklistStorage: {
		configurable: false,
		get: () => (blocklistStorage ||= new BlocklistStorage(tabId, 'options', logger)),
	},
	playerSettingsStorage: {
		configurable: false,
		get: () => (playerSettingsStorage ||= new PlayerSettingsStorage(tabId, 'options', logger)),
	},
	statsStorage: {
		configurable: false,
		get: () => (statsStorage ||= new StatsStorage(tabId, 'options', logger)),
	},
	settingsStorage: {
		configurable: false,
		get: () => (settingsStorage ||= new SettingsStorage(tabId, 'options', logger)),
	},
});

export const useLazyStorages = () => lazyStorages;
