import type { OmitIndexSignature } from 'type-fest';
import { storage } from 'wxt/storage';

import { logger } from '@/options/constants';
import {
	type BlockedChannelsMeta,
	type BlockedChannelsStorage,
	type RawBlockedChannels,
	blockedChannelsItem,
} from './blockedChannels';
import {
	type BlockedCoubTitlesMeta,
	type BlockedCoubTitlesStorage,
	type RawBlockedCoubTitles,
	blockedCoubTitlesItem,
} from './blockedCoubTitles';
import {
	type BlockedTagsMeta,
	type BlockedTagsStorage,
	type RawBlockedTags,
	blockedTagsItem,
} from './blockedTags';
import { StatsStorage, statsItem } from './stats';

export interface Backup {
	[BlockedChannelsStorage.KEY]: RawBlockedChannels;
	[BlockedChannelsStorage.META_KEY]?: OmitIndexSignature<BlockedChannelsMeta>;
	[BlockedTagsStorage.KEY]: RawBlockedTags;
	[BlockedTagsStorage.META_KEY]?: OmitIndexSignature<BlockedTagsMeta>;
	[BlockedCoubTitlesStorage.KEY]: RawBlockedCoubTitles;
	[BlockedCoubTitlesStorage.META_KEY]?: OmitIndexSignature<BlockedCoubTitlesMeta>;
}

const storageItems = [
	['blockedChannels', blockedChannelsItem],
	['blockedTags', blockedTagsItem],
	['blockedCoubTitles', blockedCoubTitlesItem],
	['stats', statsItem],
] as const;

export const createBackup = async () =>
	JSON.stringify(await storage.snapshot('local', { excludeKeys: [StatsStorage.KEY] }));

export const restoreBackup = async (data: Backup) => {
	const currentState = await storage.snapshot('local');
	await storage.restoreSnapshot('local', data);

	type RejectReason = [key: string, reason: unknown];

	const failedMigrations = (
		await Promise.allSettled(
			storageItems.map(([key, item]) =>
				item.migrate().catch(reason => {
					const res: RejectReason = [key, reason];
					throw res;
				}),
			),
		)
	).reduce<{ keys: string[]; reasons: unknown[] }>(
		(obj, res) => {
			if (res.status === 'rejected') {
				const [key, reason] = res.reason as RejectReason;
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

export class StorageMigrationsFailed extends Error {
	constructor(
		readonly keys: string[],
		readonly cause: AggregateError,
	) {
		super('some migrations are failed', { cause });
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
