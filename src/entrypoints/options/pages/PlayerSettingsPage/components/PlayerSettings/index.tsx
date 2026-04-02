import { Localized } from '@fluent/react';
import { Checkbox } from '@nextui-org/checkbox';
import { Divider } from '@nextui-org/divider';
import { Kbd } from '@nextui-org/kbd';
import type { FunctionComponent } from 'preact';

import { CardSection } from '@/options/components/CardSection';
import { HintTooltip } from '@/options/components/HintTooltip';
import { useStorageMergeCallback } from '@/options/hooks/useStorageMergeCallback';
import type { PlayerSettingsStorage, ReadonlyPlayerSettings } from '@/storage/playerSettings';

import { KeyboardShortcuts } from './components/KeyboardShortcuts';

interface Props {
	storage: PlayerSettingsStorage;
	state: ReadonlyPlayerSettings;
}

export const PlayerSettings: FunctionComponent<Props> = ({ storage, state }) => {
	const handleIsPreventPlaybackRateChange = useStorageMergeCallback(
		storage,
		'isPreventPlaybackRateChange',
	);

	const handleIsPreventBuiltInHotkeysIfModPressed = useStorageMergeCallback(
		storage,
		'isPreventBuiltInHotkeysIfModPressed',
	);

	return (
		<CardSection bodyClassName="flex gap-4" title={<Localized id="keyboard-shortcuts" />}>
			<div>
				<Checkbox
					isSelected={state.isPreventPlaybackRateChange}
					onValueChange={handleIsPreventPlaybackRateChange}
				>
					<Localized id="prevent-playback-rate-change" />
				</Checkbox>

				<HintTooltip iconClassName="ml-2">
					<Localized id="prevent-playback-rate-change-tooltip" elems={{ kbd: <Kbd /> }}>
						<span />
					</Localized>
				</HintTooltip>
			</div>

			<div>
				<Checkbox
					isSelected={state.isPreventBuiltInHotkeysIfModPressed}
					onValueChange={handleIsPreventBuiltInHotkeysIfModPressed}
				>
					<Localized id="prevent-player-built-in-hotkeys-if-mod-pressed" elems={{ kbd: <Kbd /> }}>
						<span />
					</Localized>
				</Checkbox>

				<HintTooltip iconClassName="ml-2">
					<Localized
						id="prevent-player-built-in-hotkeys-if-mod-pressed-tooltip"
						elems={{ kbd: <Kbd /> }}
					>
						<span />
					</Localized>
				</HintTooltip>
			</div>

			<Divider />

			<KeyboardShortcuts storage={storage} state={state} />
		</CardSection>
	);
};
