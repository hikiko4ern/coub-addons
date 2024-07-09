import type { ToReadonly } from '@/types/util';
import { HOTKEY_MODIFIERS_ENTRIES } from './constants';
import { getUniversalHotkeyKey } from './getUniversalHotkeyKey';
import type { Hotkey } from './types';

export const isHotkeyPressed = (event: KeyboardEvent, hotkey: ToReadonly<Hotkey>): boolean => {
	const key = getUniversalHotkeyKey(event.code);

	if (hotkey.key !== key) {
		return false;
	}

	for (const [key, mod] of HOTKEY_MODIFIERS_ENTRIES) {
		const isMustBeActive = (hotkey.mods & mod) === mod;

		if (isMustBeActive !== event[`${key}Key`]) {
			return false;
		}
	}

	return true;
};
