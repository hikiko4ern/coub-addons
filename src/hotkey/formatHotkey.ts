import type { ReadonlyPartialHotkey } from './types';

export const formatHotkey = (hotkey: ReadonlyPartialHotkey | undefined): string => {
	if (!hotkey) {
		return '';
	}

	const mods = hotkey.mods.length ? hotkey.mods.join(' + ') : '';
	return mods && hotkey.key ? `${mods} + ${hotkey.key}` : hotkey.key || mods;
};
