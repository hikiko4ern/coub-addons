import type { ReadonlyHotkey } from './types';

export const doHotkeysConflict = (
	a: ReadonlyHotkey | undefined,
	b: ReadonlyHotkey | undefined,
): boolean => {
	if (
		typeof a === 'undefined' ||
		typeof b === 'undefined' ||
		a.key !== b.key ||
		a.mods.length !== b.mods.length
	) {
		return false;
	}

	if (a.mods.length) {
		// NOTE: modifiers are always sorted the same way
		for (let i = 0; i < a.mods.length; i++) {
			if (a.mods[i] !== b.mods[i]) {
				return false;
			}
		}
	}

	return true;
};
