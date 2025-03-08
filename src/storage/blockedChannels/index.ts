import { chain, filter, imap } from 'itertools';
import type { Asyncify } from 'type-fest';
import { type Unwatch, storage } from 'wxt/storage';

import { filterMap } from '@/helpers/filterMap';
import { symmetricDifference } from '@/helpers/symmetricDifference';
import type { MaybePromise, ToReadonly } from '@/types/util';
import { Logger } from '@/utils/logger';

import { ShardedStorage, type StorageShard, type StorageWatchCallback } from '../base';
import type { StorageMeta } from '../types';
import { areBlockedChannelsEqual } from './helpers/areBlockedChannelEqual';
import { blockedChannelsToRaw } from './helpers/blockedChannelsToRaw';
import { iterRawBlockedChannels } from './helpers/iterRawBlockedChannels';
import { mergeBlockedChannels } from './helpers/mergeBlockedChannels';
import { recoverBlockedChannelsFromShards } from './helpers/recoverBlockedChannelsFromShards';
import { shardBlockedChannels } from './helpers/shardBlockedChannels';
import type { BlockedChannelData, RawBlockedChannels, RawBlockedChannelsShards } from './types';

export type { BlockedChannelData, RawBlockedChannels } from './types';

export interface BlockedChannelsMeta extends StorageMeta {}

const key = 'blockedChannels' as const,
	metaKey = `${key}$` as const,
	version = 1;

const fallbackValue: RawBlockedChannels = {
	id: [],
	title: [],
	permalink: [],
};

const blockedChannelsItem = storage.defineItem<RawBlockedChannels, BlockedChannelsMeta>(
	`local:${key}`,
	{
		version,
		fallback: fallbackValue,
	},
);

interface BlockedChannels {
	channels: Map</** channelId */ number, BlockedChannelData>;
	permalinks: Set<NonNullable<BlockedChannelData['permalink']>>;
}

export type ReadonlyBlockedChannels = ToReadonly<BlockedChannels>;

type IsBlockedListener = (isBlocked: boolean) => void;
type ListenerArgs = [diff: ReadonlySet<number>];

export type IsChannelBlockedFn = (channelId: number) => boolean;
export type IsChannelPermalinkBlockedFn = (
	permalink: NonNullable<BlockedChannelData['permalink']>,
) => boolean;

export class BlockedChannelsStorage extends ShardedStorage<
	typeof key,
	typeof metaKey,
	BlockedChannels,
	BlockedChannelsMeta,
	RawBlockedChannels,
	ListenerArgs
> {
	static readonly KEY = key;
	static readonly META_KEY = metaKey;
	static readonly STORAGE = blockedChannelsItem;
	static readonly MIGRATIONS = undefined;
	static readonly merge = mergeBlockedChannels;
	protected readonly logger: Logger;
	protected readonly version = version;

	readonly #isBlockedListeners: Record</** channelId */ number, Set<IsBlockedListener>> = {};

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger('BlockedChannelsStorage');
		super(tabId, source, childLogger, new.target.KEY, new.target.META_KEY, new.target.STORAGE);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}

	isBlocked: Asyncify<IsChannelBlockedFn> = async channelId => {
		const state = await this.getValue();
		return state.channels.has(channelId);
	};

	isBlockedPermalink: Asyncify<IsChannelPermalinkBlockedFn> = async permalink => {
		const state = await this.getValue();
		return state.permalinks.has(permalink);
	};

	createBoundedIsBlocked = async (): Promise<IsChannelBlockedFn> => {
		const state = await this.getValue();
		return channelId => state.channels.has(channelId);
	};

	listenIsBlocked = (channelId: number, listener: IsBlockedListener): Unwatch => {
		(this.#isBlockedListeners[channelId] ||= new Set()).add(listener);
		return () => void this.#isBlockedListeners[channelId]?.delete(listener);
	};

	setIsBlocked(id: number, isBlocked: false): Promise<void>;
	setIsBlocked(channel: Readonly<BlockedChannelData>, isBlocked: boolean): Promise<void>;
	async setIsBlocked(idOrChannel: number | Readonly<BlockedChannelData>, isBlocked: boolean) {
		const id = typeof idOrChannel === 'number' ? idOrChannel : idOrChannel.id;
		this.logger.debug(isBlocked ? 'blocking' : 'unblocking', 'channel', idOrChannel);

		const oldState = await this.getValue();
		const oldIsBlocked = oldState.channels.has(id);

		if (isBlocked === oldIsBlocked) {
			return;
		}

		await this.setValue(
			blockedChannelsToRaw(
				isBlocked
					? chain(oldState.channels.values(), [idOrChannel as BlockedChannelData])
					: filter(oldState.channels.values(), item => item.id !== id),
				oldState.channels.size + (isBlocked ? 1 : -1),
			),
		);
	}

	async actualizeChannelData(channel: BlockedChannelData) {
		const oldState = await this.getValue();
		const blockedChannel = oldState.channels.get(channel.id);

		this.logger.debug('actualizing channel', channel.id, blockedChannel, 'with', channel);

		if (!blockedChannel || areBlockedChannelsEqual(blockedChannel, channel)) {
			return;
		}

		await this.setValue(
			blockedChannelsToRaw(
				imap(oldState.channels.values(), item => (item.id === channel.id ? channel : item)),
				oldState.channels.size,
			),
		);
	}

	async actualizeChannelsData(channels: Iterable<BlockedChannelData>) {
		const oldState = await this.getValue();
		let newState: BlockedChannels | undefined;
		const replacedIds = new Set<number>();

		{
			using logger = this.logger.scopedGroupAuto('actualizing channels', oldState);

			for (const channel of channels) {
				if (replacedIds.has(channel.id)) {
					continue;
				}

				const blockedChannel = oldState.channels.get(channel.id);

				if (blockedChannel && !areBlockedChannelsEqual(blockedChannel, channel)) {
					logger.debug('replacing blocked channel', blockedChannel, 'with', channel);

					newState ||= BlockedChannelsStorage.copyValue(oldState);
					newState.channels.set(channel.id, channel);
					blockedChannel.permalink && newState.permalinks.delete(blockedChannel.permalink);
					channel.permalink && newState.permalinks.add(channel.permalink);
					replacedIds.add(channel.id);
				}
			}
		}

		if (newState) {
			await this.setParsedValue(newState);
		}
	}

	shardRawValue(keyPrefix: string, raw: RawBlockedChannels): MaybePromise<StorageShard<never>[]> {
		return shardBlockedChannels(this.logger, keyPrefix, raw);
	}

	async recoverRawValueFromShards(): Promise<[RawBlockedChannels, BlockedChannelsMeta]> {
		const state = await browser.storage.sync.get();
		const keyPrefix = `${key}:`;

		const shards = filterMap(
			Object.entries(state),
			([key]) => key.startsWith(keyPrefix),
			([key, value]): StorageShard<never> => ({
				key: key.slice(keyPrefix.length),
				value,
			}),
		);

		return [
			await recoverBlockedChannelsFromShards(this.logger, shards as RawBlockedChannelsShards),
			state[metaKey] as BlockedChannelsMeta,
		];
	}

	protected async notifyWatcher(
		cb: StorageWatchCallback<BlockedChannels, ListenerArgs> | undefined,
		state: ReadonlyBlockedChannels,
		oldState: RawBlockedChannels | null,
	): Promise<void> {
		const oldChannelIds = oldState ? oldState.id : (await this.getValue()).channels.keys();
		const diff = symmetricDifference(oldChannelIds, state.channels.keys());

		cb?.(state, diff);

		for (const channelId of diff) {
			const channelListeners = this.#isBlockedListeners[channelId];

			if (channelListeners) {
				for (const listener of channelListeners) {
					listener(state.channels.has(channelId));
				}
			}
		}
	}

	protected parseRawValue(raw: ToReadonly<RawBlockedChannels>): ToReadonly<BlockedChannels> {
		const value = BlockedChannelsStorage.newValue();

		for (const blockedChannel of iterRawBlockedChannels(raw)) {
			value.channels.set(blockedChannel.id, blockedChannel);
			blockedChannel.permalink && value.permalinks.add(blockedChannel.permalink);
		}

		return value;
	}

	protected toRawValue(parsed: ReadonlyBlockedChannels): RawBlockedChannels {
		return blockedChannelsToRaw(parsed.channels.values(), parsed.channels.size);
	}

	private static newValue(): BlockedChannels {
		return {
			channels: new Map(),
			permalinks: new Set(),
		};
	}

	private static copyValue(value: ReadonlyBlockedChannels): BlockedChannels {
		return {
			channels: new Map(value.channels),
			permalinks: new Set(value.permalinks),
		};
	}
}
