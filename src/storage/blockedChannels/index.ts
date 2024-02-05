import { chain, filter } from 'itertools';
import type { Unwatch } from 'wxt/storage';

import { symmetricDifference } from '@/helpers/symmetricDifference';
import type { ToReadonly } from '@/types/util';
import { Logger } from '@/utils/logger';

import { StorageBase, type StorageWatchCallback } from '../base';
import type { StorageMeta } from '../types';
import { blockedChannelsToRaw } from './helpers/blockedChannelsToRaw';
import { iterRawBlockedChannels } from './helpers/iterRawBlockedChannels';
import type { BlockedChannelData, RawBlockedChannels } from './types';

export type { BlockedChannelData, RawBlockedChannels } from './types';

export interface BlockedChannelsMeta extends StorageMeta {}

const key = 'blockedChannels' as const;

const defaultValue: RawBlockedChannels = {
	id: [],
	title: [],
	permalink: [],
};

const blockedChannelsItem = storage.defineItem<RawBlockedChannels, BlockedChannelsMeta>(
	`local:${key}`,
	{
		version: 1,
		// TODO: `defaultValue` is not returned when calling `storage.getValue()` with empty storage?
		defaultValue,
	},
);

type BlockedChannels = Map</** channelId */ number, BlockedChannelData>;
export type ReadonlyBlockedChannels = ToReadonly<BlockedChannels>;

type IsBlockedListener = (isBlocked: boolean) => void;
type ListenerArgs = [diff: ReadonlySet<number>];

export class BlockedChannelsStorage extends StorageBase<
	typeof key,
	BlockedChannels,
	BlockedChannelsMeta,
	RawBlockedChannels,
	ListenerArgs
> {
	static readonly KEY = key;
	static readonly META_KEY = `${key}$` as const;
	protected readonly logger: Logger;
	protected readonly defaultValue = defaultValue;

	readonly #isBlockedListeners: Record</** channelId */ number, Set<IsBlockedListener>> = {};

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger(new.target.name);
		super(tabId, source, childLogger, new.target.KEY, blockedChannelsItem);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}

	isBlocked = async (channelId: number) => {
		const state = await this.getValue();
		return state.has(channelId);
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
		const oldIsBlocked = oldState.has(id);

		if (isBlocked === oldIsBlocked) {
			return;
		}

		await this.setValue(
			blockedChannelsToRaw(
				isBlocked
					? chain(oldState.values(), [idOrChannel as BlockedChannelData])
					: filter(oldState.values(), item => item.id !== id),
				oldState.size + (isBlocked ? 1 : -1),
			),
		);
	}

	protected async notifyWatcher(
		cb: StorageWatchCallback<BlockedChannels, ListenerArgs> | undefined,
		state: ToReadonly<BlockedChannels>,
		oldState: RawBlockedChannels | null,
	): Promise<void> {
		const oldChannelIds = oldState ? oldState.id : (await this.getValue()).keys();
		const diff = symmetricDifference(oldChannelIds, state.keys());

		cb?.(state, diff);

		for (const channelId of diff) {
			const channelListeners = this.#isBlockedListeners[channelId];

			if (channelListeners) {
				for (const listener of channelListeners) {
					listener(state.has(channelId));
				}
			}
		}
	}

	protected parseRawValue(raw: RawBlockedChannels): BlockedChannels {
		return new Map(iterRawBlockedChannels(raw));
	}

	protected toRawValue(parsed: ReadonlyBlockedChannels): RawBlockedChannels {
		return blockedChannelsToRaw(parsed.values(), parsed.size);
	}
}
