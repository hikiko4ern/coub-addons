import { storage } from 'wxt/storage';

import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { StorageBase } from '../base';
import type { StorageMeta } from '../types';
import { type RawLocale, RawTheme, SYSTEM_LOCALE } from './types';

export interface Settings {
	theme: RawTheme;
	locale: RawLocale;
}

export interface SettingsMeta extends StorageMeta {}

export type ReadonlySettings = ToReadonly<Settings>;

const key = 'settings' as const;

const fallbackValue: Settings = {
	theme: RawTheme.SYSTEM,
	locale: SYSTEM_LOCALE,
};

const settingsItem = storage.defineItem<Settings, SettingsMeta>(`local:${key}`, {
	version: 1,
	fallback: fallbackValue,
});

export class SettingsStorage extends StorageBase<typeof key, Settings, SettingsMeta> {
	static readonly KEY = key;
	static readonly META_KEY = `${key}$` as const;
	static readonly STORAGE = settingsItem;
	static readonly MIGRATIONS = undefined;
	protected readonly logger: Logger;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger(new.target.name);
		super(tabId, source, childLogger, new.target.KEY, new.target.STORAGE);
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
