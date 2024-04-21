import type { Value } from '@/types/util';

export const HOTKEY_MODIFIERS = new Set(['ctrl', 'meta', 'alt', 'shift'] as const);
export type HotkeyModifier = Value<typeof HOTKEY_MODIFIERS>;
