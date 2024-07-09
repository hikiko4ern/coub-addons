import type { ReadonlyHotkey } from './types';

export const doHotkeysConflict = (
	a: ReadonlyHotkey | undefined,
	b: ReadonlyHotkey | undefined,
): boolean =>
	typeof a !== 'undefined' && typeof b !== 'undefined' && a.key === b.key && a.mods === b.mods;
