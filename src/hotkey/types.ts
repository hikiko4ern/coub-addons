import type { SetOptional } from 'type-fest';

import type { ToReadonly } from '@/types/util';
import type { HotkeyModifier } from './constants';

export interface Hotkey {
	mods: HotkeyModifier[];
	key: string;
}
export type ReadonlyHotkey = ToReadonly<Hotkey>;

export type PartialHotkey = SetOptional<Hotkey, 'key'>;
export type ReadonlyPartialHotkey = ToReadonly<PartialHotkey>;
