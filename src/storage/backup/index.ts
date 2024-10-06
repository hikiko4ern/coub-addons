import type { OmitIndexSignature } from 'type-fest';
import { storage } from 'wxt/storage';

import { logger } from '@/options/constants';
import {
	type BlockedChannelsMeta,
	BlockedChannelsStorage,
	type RawBlockedChannels,
} from '../blockedChannels';
import {
	type BlockedCoubTitlesMeta,
	BlockedCoubTitlesStorage,
	type RawBlockedCoubTitles,
} from '../blockedCoubTitles';
import { type BlockedTagsMeta, BlockedTagsStorage, type RawBlockedTags } from '../blockedTags';
import { type Blocklist, type BlocklistMeta, BlocklistStorage } from '../blocklist';
import {
	type PlayerSettings,
	type PlayerSettingsMeta,
	PlayerSettingsStorage,
} from '../playerSettings';
import { type Settings, type SettingsMeta, SettingsStorage } from '../settings';
import { StatsStorage } from '../stats';
import {
	CurrentStateIsOlderThanBackup,
	MissingMigrationVersion,
	MissingMigrations,
	StatesVersionMismatch,
	StorageMergeFailed,
	StorageMergesFailed,
	StorageMigrationsFailed,
	type TranslatableError,
} from './errors';

export { TranslatableError } from './errors';

export interface Backup {
	[BlockedChannelsStorage.KEY]: RawBlockedChannels;
	[BlockedChannelsStorage.META_KEY]?: OmitIndexSignature<BlockedChannelsMeta>;
	[BlockedTagsStorage.KEY]: RawBlockedTags;
	[BlockedTagsStorage.META_KEY]?: OmitIndexSignature<BlockedTagsMeta>;
	[BlockedCoubTitlesStorage.KEY]: RawBlockedCoubTitles;
	[BlockedCoubTitlesStorage.META_KEY]?: OmitIndexSignature<BlockedCoubTitlesMeta>;
	[BlocklistStorage.KEY]: Blocklist;
	[BlocklistStorage.META_KEY]?: OmitIndexSignature<BlocklistMeta>;
	[PlayerSettingsStorage.KEY]: PlayerSettings;
	[PlayerSettingsStorage.META_KEY]?: OmitIndexSignature<PlayerSettingsMeta>;
	[SettingsStorage.KEY]: Settings;
	[SettingsStorage.META_KEY]?: OmitIndexSignature<SettingsMeta>;
}

export interface ImportBackupData {
	data: Backup;
	isMerge: boolean;
}

const storagesToBackup = [
	BlockedChannelsStorage,
	BlockedTagsStorage,
	BlockedCoubTitlesStorage,
	BlocklistStorage,
	PlayerSettingsStorage,
	SettingsStorage,
] as const;

export const createBackup = async () => JSON.stringify(await createSnapshot());

export const restoreBackup = async ({ data, isMerge }: ImportBackupData) => {
	const currentState = await createSnapshot();

	if (isMerge) {
		data = mergeWithBackup(currentState, data);
	}

	await storage.restoreSnapshot('local', data);

	type MigrationFailureReason = [key: string, reason: unknown];

	const failedMigrations = (
		await Promise.allSettled(
			storagesToBackup.map(storage =>
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
			await storage.restoreSnapshot('local', currentState);
		} catch (err) {
			logger.error('failed to restore snapshot after failed migrations', err);
		}

		throw new StorageMigrationsFailed(
			failedMigrations.keys,
			new AggregateError(failedMigrations.reasons),
		);
	}
};

const createSnapshot = () =>
	storage.snapshot('local', { excludeKeys: [StatsStorage.KEY] }) as unknown as Promise<Backup>;

const mergeWithBackup = (currentState: Backup, backup: Backup): Backup => {
	const merged: Backup = { ...currentState };
	const mergeErrors: TranslatableError[] = [];

	storages: for (const storage of storagesToBackup) {
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
			const migrations: Partial<Record<number, (data: unknown) => unknown>> | undefined =
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
