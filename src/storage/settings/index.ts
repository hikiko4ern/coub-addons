import { storage } from 'wxt/storage';

import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { SyncableStorage } from '../base';
import type { StorageMeta, StorageSyncMeta } from '../types';
import { settingsMigrations } from './migrations';
import { RawTheme, SYSTEM_LOCALE, type SettingsV2 as Settings } from './types';

export type { Settings };

export interface SettingsMeta extends StorageMeta, StorageSyncMeta {}

export type ReadonlySettings = ToReadonly<Settings>;

const key = 'settings' as const,
	metaKey = `${key}$` as const;

export const settingsVersion = 2;

const fallbackValue: Settings = {
	theme: RawTheme.SYSTEM,
	locale: SYSTEM_LOCALE,
	deviceName: navigator.platform,
	isDevMode: false,
};

const settingsItem = storage.defineItem<Settings, SettingsMeta>(`local:${key}`, {
	version: settingsVersion,
	fallback: fallbackValue,
	migrations: settingsMigrations,
});

export class SettingsStorage extends SyncableStorage<
	typeof key,
	typeof metaKey,
	Settings,
	SettingsMeta
> {
	static readonly KEY = key;
	static readonly META_KEY = metaKey;
	static readonly STORAGE = settingsItem;
	static readonly MIGRATIONS = undefined;
	protected readonly logger: Logger;
	protected readonly version = settingsVersion;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger('SettingsStorage');
		super(tabId, source, childLogger, new.target.KEY, new.target.META_KEY, new.target.STORAGE);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}

	mergeWith = async (value: Partial<Settings>) => {
		const current = await this.getValue();
		return this.setValue({ ...current, ...value });
	};

	static readonly merge = (current: Settings, backup: Partial<Settings>): Settings =>
		Object.assign(current, backup);
}
