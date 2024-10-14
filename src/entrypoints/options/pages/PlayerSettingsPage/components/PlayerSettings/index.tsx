import { Localized } from '@fluent/react';
import { Checkbox } from '@nextui-org/checkbox';
import { Divider } from '@nextui-org/divider';
import { Input } from '@nextui-org/input';
import { Kbd } from '@nextui-org/kbd';
import type { FunctionComponent } from 'preact';
import type { KeyboardEventHandler } from 'preact/compat';
import { useCallback, useState } from 'preact/hooks';
import { useDebouncedCallback } from 'use-debounce';

import { CardSection } from '@/options/components/CardSection';
import { HintTooltip } from '@/options/components/HintTooltip';
import type { PlayerSettingsStorage, ReadonlyPlayerSettings } from '@/storage/playerSettings';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';

interface Props {
	storage: PlayerSettingsStorage;
	state: ReadonlyPlayerSettings;
}

const POSITIVE_NUM_RE = /^\d+$/;

export const PlayerSettings: FunctionComponent<Props> = ({ storage, state }) => {
	const [hideControlsAfter, setHideFullscreenControlsAfter] = useState(
		typeof state.hideControlsAfter === 'number' ? String(state.hideControlsAfter) : '',
	);

	const handleIsPreventPlaybackRateChange = useCallback(
		(isPreventPlaybackRateChange: boolean) => storage.mergeWith({ isPreventPlaybackRateChange }),
		[storage],
	);

	const handleHideFullscreenControlsAfterKeyPress = useCallback<
		KeyboardEventHandler<HTMLInputElement>
	>(
		e => {
			const code = e.which ? e.which : e.keyCode;
			code > 31 && (code < 48 || code > 57) && e.preventDefault();
		},
		[storage],
	);

	const saveHideFullscreenControlsAfter = useDebouncedCallback(
		useCallback(
			(value: string) =>
				storage.mergeWith({
					hideControlsAfter: POSITIVE_NUM_RE.test(value) ? Number.parseInt(value, 10) : undefined,
				}),
			[storage],
		),
		300,
	);

	const handleHideFullscreenControlsAfterValueChange = useCallback((value: string) => {
		setHideFullscreenControlsAfter(value);
		saveHideFullscreenControlsAfter(value);
	}, []);

	return (
		<div className="flex flex-wrap gap-4">
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

			<CardSection bodyClassName="flex gap-4" title={<Localized id="miscellaneous" />}>
				<Localized id="hide-controls-after" attrs={{ label: true }}>
					<Input
						name="hideControlsAfter"
						type="text"
						inputMode="numeric"
						placeholder="5000"
						value={hideControlsAfter}
						endContent={
							<div className="pointer-events-none flex items-center">
								<span className="text-default-400 text-small">
									<Localized id="milliseconds" />
								</span>
							</div>
						}
						labelPlacement="outside-left"
						onKeyPress={handleHideFullscreenControlsAfterKeyPress}
						onValueChange={handleHideFullscreenControlsAfterValueChange}
					/>
				</Localized>
			</CardSection>
		</div>
	);
};
