import { Localized, useLocalization } from '@fluent/react';
import type { FunctionComponent } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';
import type { ConditionalKeys } from 'type-fest';

import { doHotkeysConflict } from '@/hotkey/doHotkeysConflict';
import type { Hotkey, ReadonlyHotkey } from '@/hotkey/types';
import { HotkeyInput } from '@/options/components/HotkeyInput';
import type {
	PlayerSettings,
	PlayerSettingsStorage,
	ReadonlyPlayerSettings,
} from '@/storage/playerSettings';
import { FluentList } from '@/translation/intl';
import { PLAYER_HOTKEYS } from '../KeyboardShortcuts/constants';
import { BUILT_IN_HOTKEYS } from './constants';

interface Props {
	storage: PlayerSettingsStorage;
	state: ReadonlyPlayerSettings;
	settingKey: ConditionalKeys<PlayerSettings, Hotkey | undefined>;
}

export const KeyboardShortcut: FunctionComponent<Props> = ({ storage, state, settingKey }) => {
	const { l10n } = useLocalization();
	const hotkey = state[settingKey];

	const conflictsWith = useMemo(() => {
		const actions: string[] = [];

		if (hotkey && BUILT_IN_HOTKEYS.has(hotkey.key)) {
			actions.push(l10n.getString('built-in'));
		}

		for (const { key, l10nKey } of PLAYER_HOTKEYS) {
			if (key !== settingKey && doHotkeysConflict(hotkey, state[key])) {
				actions.push(l10n.getString(l10nKey));
			}
		}

		return actions.length ? actions : undefined;
	}, [l10n, state, settingKey, hotkey]);

	const handleChange = useCallback(
		(hotkey: ReadonlyHotkey | undefined) => storage.mergeWith({ [settingKey]: hotkey }),
		[storage, settingKey],
	);

	return (
		<HotkeyInput
			value={hotkey}
			errorMessage={
				conflictsWith && (
					<Localized
						id="conflicts-with-actions"
						vars={{ with: new FluentList(conflictsWith, { type: 'conjunction' }) }}
					/>
				)
			}
			onChange={handleChange}
		/>
	);
};
