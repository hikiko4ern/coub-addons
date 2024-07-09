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

type PlayerSettingsV2ChangedHotkeyKeys =
	| 'toggleDislikeHotkey'
	| 'toggleBookmarkHotkey'
	| 'toggleFullscreenHotkey';

export interface PlayerSettingsV2
	extends Omit<PlayerSettingsV1, PlayerSettingsV2ChangedHotkeyKeys>,
		Record<PlayerSettingsV2ChangedHotkeyKeys, HotkeyV2 | undefined> {}
