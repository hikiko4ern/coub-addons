import { createContext } from 'preact';

import { type AvailableLocale, DEFAULT_LOCALE } from '@/translation/bundle';

export interface LocalizationContext {
	locale: AvailableLocale;
}

export const LocalizationContext = createContext<LocalizationContext>({
	locale: DEFAULT_LOCALE,
});
