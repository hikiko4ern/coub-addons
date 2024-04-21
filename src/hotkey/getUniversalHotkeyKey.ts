/**
 * from https://github.com/JohannesKlauss/react-hotkeys-hook/blob/f31702321d5b08226b947ca8dead70348862ba59/src/parseHotkeys.ts
 */

const KEY_MAP: Record<string, string> = {
	// spell-checker: disable
	esc: 'escape',
	return: 'enter',
	'.': 'period',
	',': 'comma',
	'-': 'slash',
	' ': 'space',
	'`': 'backquote',
	'#': 'backslash',
	'+': 'bracketright',
	ShiftLeft: 'shift',
	ShiftRight: 'shift',
	AltLeft: 'alt',
	AltRight: 'alt',
	MetaLeft: 'meta',
	MetaRight: 'meta',
	OSLeft: 'meta',
	OSRight: 'meta',
	ControlLeft: 'ctrl',
	ControlRight: 'ctrl',
	// spell-checker: enable
};

export const getUniversalHotkeyKey = (key: string) =>
	key in KEY_MAP
		? KEY_MAP[key as keyof typeof KEY_MAP]
		: key
				.trim()
				.toLowerCase()
				.replace(/key|digit|numpad|arrow/, '');
