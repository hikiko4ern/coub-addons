import { HOTKEY_MODIFIERS, type HotkeyModifier } from './constants';

export const getActiveKeyboardEventModifiers = (
	event: Pick<KeyboardEvent, `${HotkeyModifier}Key`>,
) => {
	const res: HotkeyModifier[] = [];

	for (const mod of HOTKEY_MODIFIERS) {
		if (event[`${mod}Key`]) {
			res.push(mod);
		}
	}

	return res;
};
