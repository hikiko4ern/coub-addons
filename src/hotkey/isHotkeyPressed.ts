import type { ToReadonly } from '@/types/util';
import { HOTKEY_MODIFIERS } from './constants';
import { getUniversalHotkeyKey } from './getUniversalHotkeyKey';
import type { Hotkey } from './types';

export const isHotkeyPressed = (event: KeyboardEvent, hotkey: ToReadonly<Hotkey>): boolean => {
	const key = getUniversalHotkeyKey(event.code);

	if (hotkey.key !== key) {
		return false;
	}

	for (const mod of HOTKEY_MODIFIERS) {
		if (hotkey.mods.includes(mod) !== event[`${mod}Key`]) {
			return false;
		}
	}

	return true;
};
