import { Localized, useLocalization } from '@fluent/react';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@nextui-org/table';
import type { FunctionComponent } from 'preact';

import type { PlayerSettingsStorage, ReadonlyPlayerSettings } from '@/storage/playerSettings';
import { KeyboardShortcut } from '../KeyboardShortcut';
import { PLAYER_HOTKEYS } from './constants';

import styles from './styles.module.scss';

interface Props {
	storage: PlayerSettingsStorage;
	state: ReadonlyPlayerSettings;
}

export const KeyboardShortcuts: FunctionComponent<Props> = ({ storage, state }) => {
	const { l10n } = useLocalization();

	return (
		<Table
			classNames={{ table: styles['keyboard-shortcuts'] }}
			removeWrapper
			aria-label={l10n.getString('keyboard-shortcuts-settings')}
		>
			<TableHeader>
				<TableColumn>
					<Localized id="action" />
				</TableColumn>

				<TableColumn>
					<Localized id="shortcut" />
				</TableColumn>
			</TableHeader>

			<TableBody>
				{PLAYER_HOTKEYS.map(({ key, l10nKey }) => (
					<TableRow key={key}>
						<TableCell>
							<Localized id={l10nKey} />
						</TableCell>

						<TableCell className="pr-0">
							<KeyboardShortcut storage={storage} state={state} settingKey={key} />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};
