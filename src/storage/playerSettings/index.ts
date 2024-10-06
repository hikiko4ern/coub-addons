import { storage } from 'wxt/storage';

import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { StorageBase } from '../base';
import type { StorageMeta } from '../types';

import { playerSettingsMigrations } from './migrations';
import type { PlayerSettingsV3 as PlayerSettings } from './types';

export type { PlayerSettings };

export interface PlayerSettingsMeta extends StorageMeta {}

export type ReadonlyPlayerSettings = ToReadonly<PlayerSettings>;

const key = 'playerSettings' as const;

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
	copyCoubPermalinkHotkey: undefined,
};

const playerSettingsItem = storage.defineItem<PlayerSettings, PlayerSettingsMeta>(`local:${key}`, {
	version: 3,
	fallback: fallbackValue,
	migrations: playerSettingsMigrations,
});

export class PlayerSettingsStorage extends StorageBase<
	typeof key,
	PlayerSettings,
	PlayerSettingsMeta
> {
	static readonly KEY = key;
	static readonly META_KEY = `${key}$` as const;
	static readonly STORAGE = playerSettingsItem;
	static readonly MIGRATIONS = playerSettingsMigrations;
	protected readonly logger: Logger;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger(new.target.name);
		super(tabId, source, childLogger, new.target.KEY, new.target.STORAGE);
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
