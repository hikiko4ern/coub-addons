import { HotkeyModifier } from '@/hotkey/constants';
import type { Hotkey } from '@/hotkey/types';

import type { DefineMigrations } from '../migrations';
import type { playerSettingsVersion } from './index';
import type {
	HotkeyV1,
	PlayerSettingsV1,
	PlayerSettingsV2,
	PlayerSettingsV3,
	PlayerSettingsV4,
	PlayerSettingsV5,
} from './types';

type Migrations = DefineMigrations<
	typeof playerSettingsVersion,
	[PlayerSettingsV1, PlayerSettingsV2, PlayerSettingsV3, PlayerSettingsV4, PlayerSettingsV5]
>;

export const playerSettingsMigrations: Migrations = {
	2: (playerSettings): PlayerSettingsV2 => ({
		...playerSettings,
		toggleBookmarkHotkey: hotkeyV1ToV2(playerSettings.toggleBookmarkHotkey),
		toggleDislikeHotkey: hotkeyV1ToV2(playerSettings.toggleDislikeHotkey),
		toggleFullscreenHotkey: hotkeyV1ToV2(playerSettings.toggleFullscreenHotkey),
	}),

	3: (playerSettings): PlayerSettingsV3 => ({
		...playerSettings,
		copyCoubPermalinkHotkey: undefined,
	}),

	4: ({ copyCoubPermalinkHotkey, ...playerSettings }): PlayerSettingsV4 => playerSettings,

	5: (playerSettings): PlayerSettingsV5 => ({
		...playerSettings,
		isPreventBuiltInHotkeysIfModPressed: true,
	}),
};

const hotkeyV1ToV2 = (hotkey: HotkeyV1 | undefined): Hotkey | undefined =>
	hotkey && {
		...hotkey,
		mods: hotkey.mods.reduce((flags, mod) => flags | HotkeyModifier[mod], 0),
	};
