import type { HotkeyModifierKey } from '@/hotkey/constants';
import type { Hotkey as HotkeyV2 } from '@/hotkey/types';

// v1

export interface HotkeyV1 {
	mods: HotkeyModifierKey[];
	key: string;
}

export interface PlayerSettingsV1 {
	isPreventPlaybackRateChange: boolean;
	toggleDislikeHotkey: HotkeyV1 | undefined;
	toggleBookmarkHotkey: HotkeyV1 | undefined;
	toggleFullscreenHotkey: HotkeyV1 | undefined;
}

// v2

export interface PlayerSettingsV2
	extends Omit<
		PlayerSettingsV1,
		'toggleDislikeHotkey' | 'toggleBookmarkHotkey' | 'toggleFullscreenHotkey'
	> {
	toggleDislikeHotkey: HotkeyV2 | undefined;
	toggleBookmarkHotkey: HotkeyV2 | undefined;
	toggleFullscreenHotkey: HotkeyV2 | undefined;
}

// v3

export interface PlayerSettingsV3 extends PlayerSettingsV2 {
	copyCoubPermalinkHotkey: HotkeyV2 | undefined;
}

// v4

export interface PlayerSettingsV4 extends PlayerSettingsV3 {
	/**
	 * time in milliseconds after which fullscreen controls should be hidden
	 *
	 * Coub uses 5000ms by default
	 */
	hideControlsAfter: number | undefined;
}
