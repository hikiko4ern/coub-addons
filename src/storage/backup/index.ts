import type { IterableElement, OmitIndexSignature, UnionToIntersection } from 'type-fest';
import { storage } from 'wxt/storage';

import { logger } from '@/options/constants';

import type { AnyStorageBase, StorageBase } from '../base';
import { BlockedChannelsStorage } from '../blockedChannels';
import { BlockedCoubTitlesStorage } from '../blockedCoubTitles';
import { BlockedTagsStorage } from '../blockedTags';
import { BlocklistStorage } from '../blocklist';
import type { TranslatableError } from '../errors';
import { PlayerSettingsStorage } from '../playerSettings';
import { SettingsStorage } from '../settings';
import { StatsStorage } from '../stats';
import {
	CurrentStateIsOlderThanBackup,
	MissingMigrationVersion,
	MissingMigrations,
	StatesVersionMismatch,
	StorageMergeFailed,
	StorageMergesFailed,
	StorageMigrationsFailed,
} from './errors';

type ToBackup<Storage extends AnyStorageBase> =
	Storage extends StorageBase<infer Key, infer MetaKey, any, infer Meta, infer RawState, any>
		? { [key in Key]?: RawState } & { [metaKey in MetaKey]?: OmitIndexSignature<Meta> }
		: never;

export type Backup = UnionToIntersection<ToBackup<InstanceType<StorageToBackup>>>;

export interface ImportBackupData {
	storages?: Storages;
	data: Backup;
	isMerge: boolean;
}

type Storages = typeof storagesToBackup;

export type StorageToBackup = IterableElement<Storages>;

const storagesToBackup = [
	BlockedChannelsStorage,
	BlockedTagsStorage,
	BlockedCoubTitlesStorage,
	BlocklistStorage,
	PlayerSettingsStorage,
	SettingsStorage,
];

export const createBackup = async () => JSON.stringify(await createSnapshot(storagesToBackup));

export const restoreBackup = async ({
	storages = storagesToBackup,
	data,
	isMerge,
}: ImportBackupData) => {
	const currentState = await createSnapshot(storages);

	removeSyncMeta(storages, data);

	if (isMerge) {
		data = mergeWithBackup(storages, currentState, data);
	}

	await storage.restoreSnapshot('local', data);
	await migrateStorages(storages, () => storage.restoreSnapshot('local', currentState));
};

const migrateStorages = async (storages: Storages, restore: () => Promise<void>) => {
	type MigrationFailureReason = [key: string, reason: unknown];

	const failedMigrations = (
		await Promise.allSettled(
			storages.map(storage =>
				storage.STORAGE.migrate().catch(reason => {
					const res: MigrationFailureReason = [storage.KEY, reason];
					throw res;
				}),
			),
		)
	).reduce<{ keys: string[]; reasons: unknown[] }>(
		(obj, res) => {
			if (res.status === 'rejected') {
				const [key, reason] = res.reason as MigrationFailureReason;
				obj.keys.push(key);
				obj.reasons.push(reason);
				logger.error(key, 'migration failed:', reason);
			}

			return obj;
		},
		{ keys: [], reasons: [] },
	);

	if (failedMigrations.keys.length) {
		try {
			await restore();
		} catch (err) {
			logger.error('failed to restore snapshot after failed migrations', err);
		}

		throw new StorageMigrationsFailed(
			failedMigrations.keys,
			new AggregateError(failedMigrations.reasons),
		);
	}
};

const createSnapshot = async (storages: Storages) => {
	const backup = (await storage.snapshot('local', {
		excludeKeys: [StatsStorage.KEY],
	})) as unknown as Backup;
	const keepKeys = new Set(storages.flatMap(s => [s.KEY, s.META_KEY]));

	for (const key of Object.keys(backup) as (keyof typeof backup)[]) {
		if (!keepKeys.has(key)) {
			delete backup[key];
		}
	}

	removeSyncMeta(storages, backup);

	return backup;
};

const removeSyncMeta = (storages: Storages, data: Backup) => {
	for (const storage of storages) {
		const meta = data[storage.META_KEY];

		if (meta) {
			delete meta.lastSynced;
		}
	}
};

const mergeWithBackup = (storages: Storages, currentState: Backup, backup: Backup): Backup => {
	const merged: Backup = { ...currentState };
	const mergeErrors: TranslatableError[] = [];

	storages: for (const storage of storages) {
		if (!(storage.KEY in currentState)) {
			merged[storage.KEY] = backup[storage.KEY] as never;
			merged[storage.META_KEY] = backup[storage.META_KEY] as never;
			continue;
		}

		if (!(storage.KEY in backup)) {
			continue storages;
		}

		const currentVersion = parseVersion(currentState[storage.META_KEY]?.v),
			backupVersion = parseVersion(backup[storage.META_KEY]?.v);

		if (currentVersion !== backupVersion) {
			mergeErrors.push(new StatesVersionMismatch(storage.KEY, currentVersion, backupVersion));
			continue storages;
		}

		if (currentVersion < backupVersion) {
			mergeErrors.push(
				new CurrentStateIsOlderThanBackup(storage.KEY, currentVersion, backupVersion),
			);
			continue storages;
		}

		let backupData = backup[storage.KEY];

		if (currentVersion !== backupVersion) {
			const migrations: Partial<Record<number, (data: any) => any>> | undefined =
				storage.MIGRATIONS;

			if (!migrations) {
				mergeErrors.push(new MissingMigrations(storage.KEY));
				continue storages;
			}

			for (let i = backupVersion + 1; i <= currentVersion; i++) {
				const migrate = migrations[i];

				if (typeof migrate !== 'function') {
					mergeErrors.push(new MissingMigrationVersion(storage.KEY, i));
					continue storages;
				}

				backupData = migrate(backupData) as typeof backupData;
			}
		}

		try {
			merged[storage.KEY] = storage.merge(
				merged[storage.KEY] as never,
				backupData as never,
			) as never;
		} catch (err) {
			mergeErrors.push(new StorageMergeFailed(storage.KEY, err));
		}
	}

	if (mergeErrors.length) {
		throw new StorageMergesFailed(mergeErrors);
	}

	return merged;
};

const parseVersion = (version: unknown) => (typeof version === 'number' ? Math.max(version, 1) : 1);
