import { storage } from 'wxt/storage';

import type { Hotkey } from '@/hotkey/types';
import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { StorageBase } from './base';
import type { StorageMeta } from './types';

export interface PlayerSettings {
	isPreventPlaybackRateChange: boolean;
	toggleDislikeHotkey: Hotkey | undefined;
	toggleBookmarkHotkey: Hotkey | undefined;
	toggleFullscreenHotkey: Hotkey | undefined;
}

export interface PlayerSettingsMeta extends StorageMeta {}

export type ReadonlyPlayerSettings = ToReadonly<PlayerSettings>;

const key = 'playerSettings' as const;

const defaultValue: PlayerSettings = {
	isPreventPlaybackRateChange: false,
	toggleDislikeHotkey: {
		mods: [],
		key: 'd',
	},
	toggleBookmarkHotkey: {
		mods: [],
		key: 'b',
	},
	toggleFullscreenHotkey: {
		mods: [],
		key: 'f',
	},
};

export const playerSettingsItem = storage.defineItem<PlayerSettings, PlayerSettingsMeta>(
	`local:${key}`,
	{
		version: 1,
		defaultValue,
	},
);

export class PlayerSettingsStorage extends StorageBase<
	typeof key,
	PlayerSettings,
	PlayerSettingsMeta
> {
	static readonly KEY = key;
	static readonly META_KEY = `${key}$` as const;
	protected readonly logger: Logger;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger(new.target.name);
		super(tabId, source, childLogger, new.target.KEY, playerSettingsItem);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}

	mergeWith = async (value: Partial<PlayerSettings>) => {
		const current = await this.getValue();
		return this.setValue({ ...current, ...value });
	};
}
