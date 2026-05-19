import type { ReadonlyPlayerSettings } from '@/storage/playerSettings';

export const COUB_PREFIX = `${browser.runtime.id}__coub` as const;

export const ARE_PLAYER_SETTINGS_FETCHED = Symbol('playerSettings#fetched');

export type LateInitPlayerSettings =
	| { readonly [ARE_PLAYER_SETTINGS_FETCHED]: false }
	| ({ readonly [ARE_PLAYER_SETTINGS_FETCHED]: true } & ReadonlyPlayerSettings);
