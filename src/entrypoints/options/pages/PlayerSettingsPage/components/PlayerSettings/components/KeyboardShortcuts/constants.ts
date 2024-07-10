import type { ConditionalKeys } from 'type-fest';

import type { Hotkey } from '@/hotkey/types';
import type { PlayerSettings } from '@/storage/playerSettings';

interface HotkeyConfig {
	key: ConditionalKeys<PlayerSettings, Hotkey | undefined>;
	l10nKey: string;
}

export const PLAYER_HOTKEYS: HotkeyConfig[] = [
	{
		key: 'toggleDislikeHotkey',
		l10nKey: 'dislike',
	},
	{
		key: 'toggleBookmarkHotkey',
		l10nKey: 'bookmark',
	},
	{
		key: 'toggleFullscreenHotkey',
		l10nKey: 'fullscreen',
	},
	{
		key: 'copyCoubPermalinkHotkey',
		l10nKey: 'copy-coub-link',
	},
];
