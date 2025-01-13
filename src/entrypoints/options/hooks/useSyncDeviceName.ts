import { useMemo } from 'preact/hooks';

import { useLazyStorages } from './useLazyStorages';
import { StorageHookState, type StorageState, useStorageState } from './useStorageState';

export const useSyncDeviceName = () => {
	const { settingsStorage } = useLazyStorages();
	const settings = useStorageState({ storage: settingsStorage });

	return useMemo(
		(): StorageState<string> =>
			settings.status === StorageHookState.Loaded
				? {
						...settings,
						data: settings.data.deviceName,
					}
				: settings,
		[settings],
	);
};
