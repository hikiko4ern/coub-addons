import { reduce } from 'itertools';

import { filterMap } from '@/helpers/filterMap';
import { HOTKEY_MODIFIERS_ENTRIES } from './constants';
import type { ReadonlyPartialHotkey } from './types';

export const formatHotkey = (hotkey: ReadonlyPartialHotkey | undefined): string => {
	if (!hotkey) {
		return '';
	}

	const mods =
		(hotkey.mods &&
			reduce<string>(
				filterMap(
					HOTKEY_MODIFIERS_ENTRIES,
					([_, mod]) => (hotkey.mods & mod) === mod,
					entry => entry[0],
				),
				(str, mod) => `${str} + ${mod}`,
			)) ||
		'';

	return mods && hotkey.key ? `${mods} + ${hotkey.key}` : hotkey.key || mods;
};
