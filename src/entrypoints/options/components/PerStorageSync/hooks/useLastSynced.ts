import { useEffect, useState } from 'preact/hooks';
import { is } from 'superstruct';
import type { Storage } from 'wxt/browser';

import { logger } from '@/options/constants';
import { StorageHookState, type StorageState } from '@/options/hooks/useStorageState';
import { StorageLastSynced, type StorageSyncMeta } from '@/storage/types';

interface LastSynced extends Omit<StorageLastSynced, 'atUtc'> {
	at: Date;
}

export const useLastSynced = (metaKey: string) => {
	const [state, setState] = useState<StorageState<LastSynced | undefined>>({
		status: StorageHookState.Loading,
	});

	useEffect(() => {
		(async () => {
			try {
				const { [metaKey]: meta } = await browser.storage.sync.get(metaKey);

				setState(getValue(metaKey, meta));
			} catch (err) {
				logger.error('failed to load last synced for', metaKey, err);

				setState({
					status: StorageHookState.Error,
					error: err,
				});
			}
		})();

		const handleChanges = (changes: Storage.StorageAreaSyncOnChangedChangesType) => {
			if (metaKey in changes) {
				setState(getValue(metaKey, changes[metaKey].newValue));
			}
		};

		browser.storage.sync.onChanged.addListener(handleChanges);

		return () => browser.storage.sync.onChanged.removeListener(handleChanges);
	}, []);

	return state;
};

const getValue = (metaKey: string, meta: unknown): StorageState<LastSynced | undefined> => {
	const lastSynced = (meta as StorageSyncMeta | undefined)?.lastSynced;

	logger.debug('loaded last synced for', metaKey, meta);

	return {
		status: StorageHookState.Loaded,
		data: is(lastSynced, StorageLastSynced)
			? {
					...lastSynced,
					at: new Date(lastSynced.atUtc),
				}
			: undefined,
	};
};
