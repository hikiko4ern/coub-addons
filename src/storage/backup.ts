import { type Describe, array, is, number, object, optional, string } from 'superstruct';
import type { OmitIndexSignature } from 'type-fest';
import { storage } from 'wxt/storage';

import {
	type BlockedChannelsMeta,
	BlockedChannelsStorage,
	type RawBlockedChannels,
} from './blockedChannels';
import { type BlockedTagsMeta, BlockedTagsStorage, type RawBlockedTags } from './blockedTags';
import { StatsStorage } from './stats';

export interface Backup {
	[BlockedChannelsStorage.KEY]: RawBlockedChannels;
	[BlockedChannelsStorage.META_KEY]?: OmitIndexSignature<BlockedChannelsMeta>;
	[BlockedTagsStorage.KEY]: RawBlockedTags;
	[BlockedTagsStorage.META_KEY]?: OmitIndexSignature<BlockedTagsMeta>;
}

export const createBackup = async () =>
	JSON.stringify(await storage.snapshot('local', { excludeKeys: [StatsStorage.KEY] }));

export const restoreBackup = (data: Backup) => storage.restoreSnapshot('local', data);

const Backup: Describe<Backup> = object({
	[BlockedChannelsStorage.KEY]: object({
		id: array(number()),
		title: array(string()),
		permalink: array(optional(string())),
	}),
	[BlockedChannelsStorage.META_KEY]: optional(
		object({
			v: number(),
		}),
	),
	[BlockedTagsStorage.KEY]: string(),
	[BlockedTagsStorage.META_KEY]: optional(
		object({
			v: number(),
		}),
	),
});

export const isBackup = (value: unknown): value is Backup => is(value, Backup);
