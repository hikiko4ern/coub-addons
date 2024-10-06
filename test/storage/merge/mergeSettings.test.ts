import { it } from 'vitest';

import { type Settings, SettingsStorage } from '@/storage/settings';
import { RawTheme } from '@/storage/settings/types';

const mergeSettings = SettingsStorage.merge;

const settings: Settings = { ...SettingsStorage.STORAGE.fallback };

it('should merge settings', ({ expect }) => {
	const t = (backup: Partial<Settings>) =>
		expect(mergeSettings({ ...settings }, backup)).toStrictEqual({ ...settings, ...backup });

	t({});

	t({ theme: RawTheme.DARK });

	t({ locale: 'ru-RU' });

	t({ theme: RawTheme.DARK, locale: 'ru-RU' });
});
