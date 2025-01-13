import { useLazyStorages } from './useLazyStorages';
import { StorageHookState, useStorageState } from './useStorageState';

export const useIsDevMode = () => {
	const { settingsStorage } = useLazyStorages();
	const settings = useStorageState({ storage: settingsStorage });

	return settings.status === StorageHookState.Loaded && settings.data.isDevMode;
};
