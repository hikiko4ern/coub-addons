import { useComputed, useSignal } from '@preact/signals';
import isEqualDeep from 'fast-deep-equal';
import { useEffect } from 'preact/hooks';

import { logger } from '@/options/constants';
import type { AnySyncableStorage, StorageShard } from '@/storage/base';
import type { StorageSyncMeta } from '@/storage/types';

type Shards = StorageShard<'sync', unknown>[];

export const useAreShardsEqual = (storage: AnySyncableStorage) => {
	const localShards = useSignal<Shards>();
	const syncShards = useSignal<Shards>();

	useEffect(() => {
		const loadLocalShards = () =>
			void storage
				.getSyncItems({})
				.then(([shards]) => (localShards.value = shards))
				.catch(err => logger.error('failed to get local shards:', err));

		loadLocalShards();

		return storage.watch(loadLocalShards);
	}, [storage]);

	useEffect(() => {
		const loadSyncShards = () =>
			void storage
				.getShardsFromSync(true)
				.then(([shards, { [storage.metaKey]: meta }]) => {
					shards.push({
						key: storage.metaKey,
						value: meta,
					});

					for (const shard of shards) {
						shard.key = `sync:${shard.key}`;
					}

					syncShards.value = shards;
				})
				.catch(err => logger.error('failed to get sync shards:', err));

		loadSyncShards();

		browser.storage.sync.onChanged.addListener(loadSyncShards);
		return () => browser.storage.sync.onChanged.removeListener(loadSyncShards);
	}, [storage]);

	return useComputed((): boolean => {
		const local = localShards.value,
			sync = syncShards.value;

		if (!Array.isArray(local) || !Array.isArray(sync)) {
			return true;
		}

		if (local.length !== sync.length) {
			return false;
		}

		const syncMap = new Map(sync.map(shard => [shard.key, shard.value]));

		return local.every(shard => {
			if (!syncMap.has(shard.key)) {
				return false;
			}

			const local = shard.value,
				sync = syncMap.get(shard.key);

			if (shard.key.endsWith('$')) {
				if (typeof sync === 'object' && sync !== null) {
					delete (sync as StorageSyncMeta).lastSynced;
				}
			}

			return isEqualDeep(local, sync);
		});
	});
};
