import { createContext } from 'preact';

import type { AvailableLocale } from '@/translation/bundle';
import { DEFAULT_LOCALE } from '@/translation/constants';

export interface LocalizationContext {
	locale: AvailableLocale;
}

export const LocalizationContext = createContext<LocalizationContext>({
	locale: DEFAULT_LOCALE,
});
