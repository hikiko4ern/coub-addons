import { HotkeyModifier } from '@/hotkey/constants';
import type { Hotkey } from '@/hotkey/types';
import type { HotkeyV1, PlayerSettingsV1, PlayerSettingsV2, PlayerSettingsV3 } from './types';

// biome-ignore lint/suspicious/noExplicitAny:
type Migrations = Record<2 | 3, (playerSettings: any) => unknown>;

export const playerSettingsMigrations: Migrations = {
	2: (playerSettings: PlayerSettingsV1): PlayerSettingsV2 => ({
		...playerSettings,
		toggleBookmarkHotkey: hotkeyV1ToV2(playerSettings.toggleBookmarkHotkey),
		toggleDislikeHotkey: hotkeyV1ToV2(playerSettings.toggleDislikeHotkey),
		toggleFullscreenHotkey: hotkeyV1ToV2(playerSettings.toggleFullscreenHotkey),
	}),
	3: (playerSettings: PlayerSettingsV2): PlayerSettingsV3 => ({
		...playerSettings,
		copyCoubPermalinkHotkey: undefined,
	}),
};

const hotkeyV1ToV2 = (hotkey: HotkeyV1 | undefined): Hotkey | undefined =>
	hotkey && {
		...hotkey,
		mods: hotkey.mods.reduce((flags, mod) => flags | HotkeyModifier[mod], 0),
	};
