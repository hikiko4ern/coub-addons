import { Localized } from '@fluent/react';
import { Checkbox } from '@nextui-org/checkbox';
import { Divider } from '@nextui-org/divider';
import { Kbd } from '@nextui-org/kbd';
import type { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';

import { CardSection } from '@/options/components/CardSection';
import { HintTooltip } from '@/options/components/HintTooltip';
import type { PlayerSettingsStorage, ReadonlyPlayerSettings } from '@/storage/playerSettings';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';

interface Props {
	storage: PlayerSettingsStorage;
	state: ReadonlyPlayerSettings;
}

export const PlayerSettings: FunctionComponent<Props> = ({ storage, state }) => {
	const handleIsPreventPlaybackRateChange = useCallback(
		(isPreventPlaybackRateChange: boolean) => storage.mergeWith({ isPreventPlaybackRateChange }),
		[storage],
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

			<Divider />

			<KeyboardShortcuts storage={storage} state={state} />
		</CardSection>
	);
};
