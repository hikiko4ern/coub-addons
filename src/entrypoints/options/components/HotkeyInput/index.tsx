import { Localized, useLocalization } from '@fluent/react';
import PencilIcon from '@heroicons/react/16/solid/PencilIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import { Button } from '@nextui-org/button';
import { Chip } from '@nextui-org/chip';
import { Input } from '@nextui-org/input';
import cx from 'clsx';
import type { FunctionComponent, VNode } from 'preact';

import { formatHotkey } from '@/hotkey/formatHotkey';
import type { ReadonlyHotkey } from '@/hotkey/types';
import { useLocalizationContext } from '@/options/hooks/useLocalizationContext';
import { useRecordHotkey } from './useRecordHotkey';

interface Props {
	value: ReadonlyHotkey | undefined;
	errorMessage: VNode | undefined;
	onChange: (hotkey: ReadonlyHotkey | undefined) => void;
}

export const HotkeyInput: FunctionComponent<Props> = ({ value, errorMessage, onChange }) => {
	const { l10n } = useLocalization();
	const { locale } = useLocalizationContext();

	const [inputRef, hotkey, { isValid, isRecording, start, clear, ...handlers }] = useRecordHotkey({
		value,
		onChange,
	});

	const endContent = isRecording ? (
		<Chip className="cursor-default" color="warning" size="sm" variant="flat">
			<Localized id="recording-key-combination-label" />
		</Chip>
	) : (
		<>
			<Button
				className="h-7 min-w-7"
				size="sm"
				variant="flat"
				isIconOnly
				aria-label={l10n.getString('edit')}
				onPress={start}
			>
				<PencilIcon width={16} />
			</Button>

			<Button
				className="ml-1 h-7 min-w-7"
				size="sm"
				color="danger"
				variant="light"
				isIconOnly
				aria-label={l10n.getString('clear')}
				onPress={clear}
			>
				<TrashIcon width={16} />
			</Button>
		</>
	);

	return (
		<Input
			{...handlers}
			ref={inputRef}
			className={cx('w-72', {
				'!w-80': locale === 'ru-RU',
			})}
			placeholder={isRecording ? l10n.getString('press-any-key-combination') : undefined}
			value={formatHotkey(hotkey)}
			isInvalid={!isValid || !!errorMessage}
			errorMessage={errorMessage}
			endContent={endContent}
			readOnly
		/>
	);
};
