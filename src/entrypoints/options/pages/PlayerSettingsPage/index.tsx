import { Localized } from '@fluent/react';
import type { FunctionComponent } from 'preact';

import { ErrorCode } from '@/options/components/ErrorCode';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';

import { PlayerSettings } from './components/PlayerSettings';

export const PlayerSettingsPage: FunctionComponent = () => {
	const { playerSettingsStorage } = useLazyStorages();
	const playerSettings = useStorageState({ storage: playerSettingsStorage });

	switch (playerSettings.status) {
		case StorageHookState.Loaded:
			return <PlayerSettings storage={playerSettingsStorage} state={playerSettings.data} />;

		case StorageHookState.Loading:
			return <Localized id="loading" />;

		case StorageHookState.Error:
			return <ErrorCode data={playerSettings.error} />;
	}
};
