import { Localized } from '@fluent/react';
import QuestionMarkCircleIcon from '@heroicons/react/24/outline/QuestionMarkCircleIcon';
import { Checkbox } from '@nextui-org/checkbox';
import { Divider } from '@nextui-org/divider';
import { Kbd } from '@nextui-org/kbd';
import { Tooltip } from '@nextui-org/tooltip';
import type { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';

import { CardSection } from '@/options/components/CardSection';
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

				<Tooltip
					content={
						<Localized id="prevent-playback-rate-change-tooltip" elems={{ kbd: <Kbd /> }}>
							<span />
						</Localized>
					}
					placement="right"
				>
					<QuestionMarkCircleIcon className="ml-2 inline-block h-4 w-4 align-baseline" />
				</Tooltip>
			</div>

			<Divider />

			<KeyboardShortcuts storage={storage} state={state} />
		</CardSection>
	);
};
