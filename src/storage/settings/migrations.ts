import type { DefineMigrations } from '../migrations';
import type { settingsVersion } from './index';
import type { SettingsV1, SettingsV2 } from './types';

type Migrations = DefineMigrations<typeof settingsVersion, [SettingsV1, SettingsV2]>;

export const settingsMigrations: Migrations = {
	2: (settings): SettingsV2 => ({
		...settings,
		deviceName: navigator.platform,
		isDevMode: false,
	}),
};
