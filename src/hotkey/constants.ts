export enum HotkeyModifier {
	ctrl = 1 << 0,
	meta = 1 << 1,
	alt = 1 << 2,
	shift = 1 << 3,
}

export type HotkeyModifierKey = keyof typeof HotkeyModifier;

export const HOTKEY_MODIFIERS = Object.values(HotkeyModifier).filter(v => typeof v === 'number');

export const HOTKEY_MODIFIERS_ENTRIES = Object.entries(HotkeyModifier).filter(
	(entry): entry is [HotkeyModifierKey, HotkeyModifier] => typeof entry[1] === 'number',
);
