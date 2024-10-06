import { chain, filter, imap } from 'itertools';
import type { Asyncify } from 'type-fest';
import { type Unwatch, storage } from 'wxt/storage';

import { symmetricDifference } from '@/helpers/symmetricDifference';
import type { ToReadonly } from '@/types/util';
import { Logger } from '@/utils/logger';

import { StorageBase, type StorageWatchCallback } from '../base';
import type { StorageMeta } from '../types';
import { areBlockedChannelsEqual } from './helpers/areBlockedChannelEqual';
import { blockedChannelsToRaw } from './helpers/blockedChannelsToRaw';
import { iterRawBlockedChannels } from './helpers/iterRawBlockedChannels';
import { mergeBlockedChannels } from './helpers/mergeBlockedChannels';
import type { BlockedChannelData, RawBlockedChannels } from './types';

export type { BlockedChannelData, RawBlockedChannels } from './types';

export interface BlockedChannelsMeta extends StorageMeta {}

const key = 'blockedChannels' as const;

const fallbackValue: RawBlockedChannels = {
	id: [],
	title: [],
	permalink: [],
};

const blockedChannelsItem = storage.defineItem<RawBlockedChannels, BlockedChannelsMeta>(
	`local:${key}`,
	{
		version: 1,
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

export class BlockedChannelsStorage extends StorageBase<
	typeof key,
	BlockedChannels,
	BlockedChannelsMeta,
	RawBlockedChannels,
	ListenerArgs
> {
	static readonly KEY = key;
	static readonly META_KEY = `${key}$` as const;
	static readonly STORAGE = blockedChannelsItem;
	static readonly MIGRATIONS = undefined;
	static readonly merge = mergeBlockedChannels;
	protected readonly logger: Logger;

	readonly #isBlockedListeners: Record</** channelId */ number, Set<IsBlockedListener>> = {};

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger(new.target.name);
		super(tabId, source, childLogger, new.target.KEY, new.target.STORAGE);
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

		this.logger.debug('actualizing channels', oldState);

		for (const channel of channels) {
			if (replacedIds.has(channel.id)) {
				continue;
			}

			const blockedChannel = oldState.channels.get(channel.id);

			if (blockedChannel && !areBlockedChannelsEqual(blockedChannel, channel)) {
				this.logger.debug('replacing blocked channel', blockedChannel, 'with', channel);

				newState ||= BlockedChannelsStorage.copyValue(oldState);
				newState.channels.set(channel.id, channel);
				blockedChannel.permalink && newState.permalinks.delete(blockedChannel.permalink);
				channel.permalink && newState.permalinks.add(channel.permalink);
				replacedIds.add(channel.id);
			}
		}

		if (newState) {
			await this.setParsedValue(newState);
		}
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
