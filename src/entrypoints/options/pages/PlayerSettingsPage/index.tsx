import { Localized } from '@fluent/react';
import type { FunctionComponent, VNode } from 'preact';

import { ErrorCode } from '@/options/components/ErrorCode';
import { PerStorageSync } from '@/options/components/PerStorageSync';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';

import { PlayerSettings } from './components/PlayerSettings';

export const PlayerSettingsPage: FunctionComponent = () => {
	const { playerSettingsStorage } = useLazyStorages();
	const playerSettings = useStorageState({ storage: playerSettingsStorage });

	let content: string | VNode;

	switch (playerSettings.status) {
		case StorageHookState.Loaded:
			content = <PlayerSettings storage={playerSettingsStorage} state={playerSettings.data} />;
			break;

		case StorageHookState.Loading:
			content = <Localized id="loading" />;
			break;

		case StorageHookState.Error:
			content = <ErrorCode data={playerSettings.error} />;
			break;
	}

	return (
		<>
			<PerStorageSync className="mb-4" storage={playerSettingsStorage} />

			{content}
		</>
	);
};
