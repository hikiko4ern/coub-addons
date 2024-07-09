import type { SetOptional } from 'type-fest';

import type { ToReadonly } from '@/types/util';

export interface Hotkey {
	mods: number;
	key: string;
}
export type ReadonlyHotkey = ToReadonly<Hotkey>;

export type PartialHotkey = SetOptional<Hotkey, 'key'>;
export type ReadonlyPartialHotkey = ToReadonly<PartialHotkey>;
