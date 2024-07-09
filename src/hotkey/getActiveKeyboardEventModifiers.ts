import { HOTKEY_MODIFIERS_ENTRIES, type HotkeyModifierKey } from './constants';

export const getActiveKeyboardEventModifiers = (
	event: Pick<KeyboardEvent, `${HotkeyModifierKey}Key`>,
) => {
	let res = 0;

	for (const [key, mod] of HOTKEY_MODIFIERS_ENTRIES) {
		if (event[`${key}Key`]) {
			res |= mod;
		}
	}

	return res;
};
