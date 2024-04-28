import type { AvailableLocale } from '@/translation/bundle';
import type { Value } from '@/types/util';

export namespace Theme {
	export const LIGHT = 'light';
	export const DARK = 'dark';
}
export type Theme = Value<typeof Theme>;

export const RawTheme = {
	...Theme,
	SYSTEM: 'system',
} as const;
export type RawTheme = Value<typeof RawTheme>;

export const SYSTEM_LOCALE = 'system';

export type RawLocale = AvailableLocale | typeof SYSTEM_LOCALE;
