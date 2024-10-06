import { it } from 'vitest';

import { HotkeyModifier } from '@/hotkey/constants';
import { type PlayerSettings, PlayerSettingsStorage } from '@/storage/playerSettings';

const mergePlayerSettings = PlayerSettingsStorage.merge;

const settings: PlayerSettings = { ...PlayerSettingsStorage.STORAGE.fallback };

it('should merge player settings', ({ expect }) => {
	const t = (backup: Partial<PlayerSettings>) =>
		expect(mergePlayerSettings({ ...settings }, backup)).toStrictEqual({ ...settings, ...backup });

	t({});

	t({ isPreventPlaybackRateChange: true });

	t({ toggleDislikeHotkey: undefined });

	t({ toggleBookmarkHotkey: undefined });

	t({ toggleFullscreenHotkey: undefined });

	t({ copyCoubPermalinkHotkey: { mods: HotkeyModifier.ctrl | HotkeyModifier.alt, key: 'c' } });

	t({
		isPreventPlaybackRateChange: true,
		toggleDislikeHotkey: undefined,
		toggleBookmarkHotkey: undefined,
		toggleFullscreenHotkey: undefined,
		copyCoubPermalinkHotkey: { mods: HotkeyModifier.ctrl | HotkeyModifier.alt, key: 'c' },
	});
});
