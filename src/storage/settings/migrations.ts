import type { SettingsV1, SettingsV2 } from './types';

type Migrations = Record<2, (settings: any) => unknown>;

export const settingsMigrations: Migrations = {
	2: (settings: SettingsV1): SettingsV2 => ({
		...settings,
		isDevMode: false,
	}),
};
