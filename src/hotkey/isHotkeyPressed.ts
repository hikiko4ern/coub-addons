import type { ToReadonly } from '@/types/util';
import { getUniversalHotkeyKey } from './getUniversalHotkeyKey';
import type { Hotkey } from './types';

export const isHotkeyPressed = (event: KeyboardEvent, hotkey: ToReadonly<Hotkey>): boolean => {
	const key = getUniversalHotkeyKey(event.code);

	if (hotkey.key !== key) {
		return false;
	}

	for (const mod of hotkey.mods) {
		if (!event[`${mod}Key`]) {
			return false;
		}
	}

	return true;
};
