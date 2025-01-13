import { storage } from 'wxt/storage';

import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { SyncableStorage } from '../base';
import type { StorageMeta, StorageSyncMeta } from '../types';
import { playerSettingsMigrations } from './migrations';
import type { PlayerSettingsV4 as PlayerSettings } from './types';

export type { PlayerSettings };

export interface PlayerSettingsMeta extends StorageMeta, StorageSyncMeta {}

export type ReadonlyPlayerSettings = ToReadonly<PlayerSettings>;

const key = 'playerSettings' as const,
	metaKey = `${key}$` as const,
	version = 4;

const fallbackValue: PlayerSettings = {
	isPreventPlaybackRateChange: false,
	toggleDislikeHotkey: {
		mods: 0,
		key: 'd',
	},
	toggleBookmarkHotkey: {
		mods: 0,
		key: 'b',
	},
	toggleFullscreenHotkey: {
		mods: 0,
		key: 'f',
	},
};

const playerSettingsItem = storage.defineItem<PlayerSettings, PlayerSettingsMeta>(`local:${key}`, {
	version,
	fallback: fallbackValue,
	migrations: playerSettingsMigrations,
});

export class PlayerSettingsStorage extends SyncableStorage<
	typeof key,
	typeof metaKey,
	PlayerSettings,
	PlayerSettingsMeta
> {
	static readonly KEY = key;
	static readonly META_KEY = metaKey;
	static readonly STORAGE = playerSettingsItem;
	static readonly MIGRATIONS = playerSettingsMigrations;
	protected readonly logger: Logger;
	protected readonly version = version;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger('PlayerSettingsStorage');
		super(tabId, source, childLogger, new.target.KEY, new.target.META_KEY, new.target.STORAGE);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}

	mergeWith = async (value: Partial<PlayerSettings>) => {
		const current = await this.getValue();
		return this.setValue({ ...current, ...value });
	};

	static readonly merge = (
		current: PlayerSettings,
		backup: Partial<PlayerSettings>,
	): PlayerSettings => Object.assign(current, backup);
}
