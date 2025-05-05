import type { AvailableLocale } from '@/translation/bundle';
import type { Value } from '@/types/util';

// v1

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

export interface SettingsV1 {
	theme: RawTheme;
	locale: RawLocale;
}

// v2

export interface SettingsV2 extends SettingsV1 {
	/** have user enabled dev mode? */
	isDevMode: boolean;
}
