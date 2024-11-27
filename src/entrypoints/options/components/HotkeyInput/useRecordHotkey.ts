/**
 * inspired by https://github.com/Wxh16144/react-record-hotkey/blob/d84656b995eb1a3f1a6d6e2ea756f984cb097522/packages/react-use-record-hotkey/src/useRecordHotkey.ts
 */

import type { JSX } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { getActiveKeyboardEventModifiers } from '@/hotkey/getActiveKeyboardEventModifiers';
import { getUniversalHotkeyKey } from '@/hotkey/getUniversalHotkeyKey';
import type { ReadonlyHotkey, ReadonlyPartialHotkey } from '@/hotkey/types';
import type { ExtractFunction, Value } from '@/types/util';

const STOP_ON_PRESSED = new Set(['escape', 'enter'] as const);
const ALLOWED_CHARS = new Set([
	// spell-checker: disable
	'backquote',
	'space',
	'enter',
	'minus',
	'plus',
	'equal',
	'backspace',
	'escape',
	'pageup',
	'pagedown',
	'home',
	'end',
	'delete',
	'tab',
	'bracketleft',
	'bracketright',
	'semicolon',
	'quote',
	'comma',
	'period',
	'slash',
	'backslash',
	// spell-checker: enable
] as const);

export interface Options {
	value: ReadonlyHotkey | undefined;
	onChange: (hotkey: ReadonlyHotkey | undefined) => void;
}

// autocorrect: false
// React Spectrum doesn't work well with Preact's compat ヾ(`ヘ´)ﾉﾞ
type RscKeyboardNativeEvent = Omit<KeyboardEvent, 'target'> & { target?: HTMLInputElement };

interface RscKeyboardEvent extends Pick<KeyboardEvent, 'preventDefault'> {
	nativeEvent: RscKeyboardNativeEvent;
}

export const useRecordHotkey = (options: Options) => {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const blurredBy = useRef<Value<typeof STOP_ON_PRESSED>>();
	const [hotkey, setHotkey] = useState<ReadonlyPartialHotkey | undefined>(options.value);
	const hotkeyRef = useWatchingRef(hotkey);
	const [isRecording, setIsRecording] = useState(false);

	const propsValueRef = useWatchingRef(options.value);
	const onChange = useWatchingRef(options?.onChange);

	useEffect(() => {
		setHotkey(options.value);
	}, [options.value]);

	const reset = useCallback(() => {
		setHotkey(propsValueRef.current);
		blurredBy.current = undefined;
	}, []);

	const start = useCallback(() => {
		reset();
		setIsRecording(true);
		inputRef.current?.focus();
	}, []);

	const clear = useCallback(() => {
		setHotkey(undefined);
		setIsRecording(false);
		onChange.current?.(undefined);
		blurredBy.current = undefined;
	}, []);

	const handleBlur = useCallback(() => {
		setIsRecording(false);

		if (hotkeyRef.current !== propsValueRef.current) {
			if (blurredBy.current !== 'escape' && isValidHotkey(hotkeyRef.current)) {
				onChange.current?.(hotkeyRef.current);
			} else {
				reset();
			}
		}

		blurredBy.current = undefined;
	}, []);

	const handleKeyDown = useCallback(
		(event: RscKeyboardEvent) => {
			const nativeEvent = event.nativeEvent;
			const key = getUniversalHotkeyKey(nativeEvent.code);

			if (!isRecording) {
				key === 'enter' && start();
				return;
			}

			event.preventDefault();

			const activeModifiers = getActiveKeyboardEventModifiers(nativeEvent);

			if (!activeModifiers && isStopKey(key)) {
				setIsRecording(false);
				blurredBy.current = key;
				nativeEvent.target?.blur?.();
				return;
			}

			const nonModifierKey =
				// alphanumeric
				(nativeEvent.keyCode >= 48 && nativeEvent.keyCode <= 90) ||
				// numpad numeric
				(nativeEvent.keyCode >= 96 && nativeEvent.keyCode <= 105) ||
				// F1 - F12
				(nativeEvent.keyCode >= 112 && nativeEvent.keyCode <= 123) ||
				// allowed chars
				isAllowedChar(key)
					? key
					: undefined;

			if (activeModifiers || nonModifierKey) {
				setHotkey({
					mods: activeModifiers,
					key: nonModifierKey,
				});
			} else {
				reset();
			}
		},
		[isRecording],
	);

	return [
		inputRef,
		hotkey,
		{
			isValid: isValidHotkey(hotkey),
			isRecording,
			start,
			clear,
			onBlur: handleBlur,
			onKeyDown: handleKeyDown as unknown as ExtractFunction<
				JSX.KeyboardEventHandler<HTMLInputElement>
			>,
		},
	] as const;
};

const isStopKey = (key: string): key is Value<typeof STOP_ON_PRESSED> =>
	STOP_ON_PRESSED.has(key as never);

const isAllowedChar = (key: string): key is Value<typeof ALLOWED_CHARS> =>
	ALLOWED_CHARS.has(key as never);

const isValidHotkey = (hotkey: ReadonlyPartialHotkey | undefined): hotkey is ReadonlyHotkey =>
	typeof hotkey === 'undefined' || typeof hotkey.key === 'string';
