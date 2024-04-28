import { createContext } from 'preact';

import { type RawLocale, RawTheme, SYSTEM_LOCALE, Theme } from '@/storage/settings/types';
import type { AvailableLocale } from '@/translation/bundle';
import { DEFAULT_LOCALE } from '@/translation/constants';

export interface Settings {
	locales: AvailableLocale[];
	rawLocale: RawLocale;
	theme: Theme;
	rawTheme: RawTheme;
}

export const SettingsContext = createContext<Settings>({
	locales: [DEFAULT_LOCALE],
	rawLocale: SYSTEM_LOCALE,
	theme: Theme.LIGHT,
	rawTheme: RawTheme.SYSTEM,
});
