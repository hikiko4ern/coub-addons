import type { IsNever } from 'type-fest';
import type { StorageItemKey, Unwatch, WxtStorageItem } from 'wxt/storage';

import { EventDispatcher, EventListener } from '@/events';
import { filterMap } from '@/helpers/filterMap';
import type { MaybePromise, ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { NoShardsError } from './errors';
import {
	type StorageEvent,
	StorageEventTrigger,
	type StorageMeta,
	type StorageSyncMeta,
	storageListenerArgs,
	storageStateType,
} from './types';

export type AnyStorageBase = StorageBase<any, any, any, any, any, any>;
export type AnySyncableStorage = SyncableStorage<any, any, any, any, any, any, any>;

export type StorageWatchCallback<State, ListenerArgs extends unknown[] = []> = (
	state: ToReadonly<State>,
	...args: ListenerArgs
) => void;

export interface StorageItem<Value> {
	key: StorageItemKey;
	value: Value;
}

export interface StorageShard<Prefix extends string = never, Value = unknown> {
	key: IsNever<Prefix> extends true ? string | undefined : `${Prefix}:${string}`;
	value: Value;
}

export abstract class StorageBase<
	Key extends string,
	MetaKey extends `${Key}$`,
	State,
	TMetadata extends StorageMeta = StorageMeta,
	RawState = State,
	ListenerArgs extends unknown[] = [],
> implements Disposable
{
	protected abstract readonly logger: Logger;
	protected abstract readonly version: number;

	readonly key: Key;
	readonly metaKey: MetaKey;
	readonly [storageStateType]?: NoInfer<State>;
	readonly [storageListenerArgs]?: NoInfer<ListenerArgs>;
	readonly #storage;
	readonly #source;
	readonly #tabId;
	readonly #watchers = new Set<StorageWatchCallback<State, ListenerArgs>>();
	readonly #unwatch: Unwatch;
	readonly #eventListener: EventListener;
	protected statePromise: Promise<ToReadonly<State>> | undefined;
	#state!: ToReadonly<State>;
	#isVersionMetaSaved = false;

	constructor(
		tabId: number | undefined,
		source: string,
		logger: Logger,
		key: Key,
		metaKey: MetaKey,
		storage: WxtStorageItem<RawState, TMetadata>,
	) {
		this.#tabId = tabId;
		this.#source = source;
		this.key = key;
		this.metaKey = metaKey;
		this.#storage = storage;

		this.initialize();

		this.#unwatch = this.#storage.watch((_state, oldState) => {
			const state = this.parseRawValue(_state as ToReadonly<RawState>);
			this.#state = state;
			this.#notifyWatchers(state, oldState, false);
		});

		this.#eventListener = new EventListener(logger, msg => {
			if (msg.type !== 'StorageUpdatedEvent' || msg.data.key !== this.key) {
				return;
			}

			const isOutsideUpdate = msg.data.source !== this.#source || msg.data.tabId !== this.#tabId;

			if (isOutsideUpdate || msg.data.trigger === StorageEventTrigger.SetValue) {
				if (isOutsideUpdate) {
					// we don't have to clone `state` as it's already `structuredClone`d (and also it's immutable)
					// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities#data_cloning_algorithm
					this.#state = msg.data.state as ToReadonly<State>;
				}

				this.#notifyWatchers(this.#state, msg.data.oldState as RawState | null, false);
			}
		});
	}

	initialize() {
		return (this.statePromise = Promise.all([this.#storage.getValue(), this.#storage.getMeta()])
			.then(([rawState, meta]) => {
				this.#isVersionMetaSaved = 'v' in meta;
				const state = (this.#state = this.parseRawValue(rawState as ToReadonly<RawState>));
				this.logger.debug('initialized with state', state, 'from raw', rawState);
				return state;
			})
			.finally(() => (this.statePromise = undefined)));
	}

	async reinitialize() {
		const oldState = this.toRawValue(await this.getValue());
		const state = await this.initialize();
		this.#notifyWatchers(state, oldState, true, StorageEventTrigger.SetValue);
	}

	getValue() {
		if (this.statePromise) {
			return this.statePromise;
		}

		return this.#state;
	}

	async getItems(): Promise<[state: StorageItem<RawState>, meta: StorageItem<TMetadata>]> {
		const [state, meta] = await storage.getItems([this.#storage.key, `${this.#storage.key}$`]);
		return [state, meta];
	}

	watch(cb: StorageWatchCallback<State, ListenerArgs>): Unwatch {
		this.#watchers.add(cb);
		return () => void this.#watchers.delete(cb);
	}

	clear() {
		return this.setValue(structuredClone(this.#storage.fallback) as ToReadonly<RawState>);
	}

	#notifyWatchers(
		state: ToReadonly<State>,
		oldState: RawState | null,
		isDispatchEvent: boolean,
		eventTrigger?: StorageEventTrigger,
	) {
		using logger = this.logger.scopedGroupAuto('notifying watchers');
		logger.debug({ state, oldState, watchers: this.#watchers });

		if (this.#watchers.size) {
			for (const cb of this.#watchers) {
				this.notifyWatcher(cb, state, oldState);
			}
		} else {
			this.notifyWatcher(undefined, state, oldState);
		}

		isDispatchEvent &&
			EventDispatcher.dispatchStorageUpdate({
				tabId: this.#tabId,
				source: this.#source,
				key: this.key,
				state,
				oldState,
				trigger: eventTrigger,
			} as StorageEvent);
	}

	#saveValue(value: RawState) {
		const setValuePromise = this.#storage.setValue(value);

		if (this.#isVersionMetaSaved) {
			return setValuePromise;
		}

		// WXT does not save the version when saving the value,
		// which causes the current non-1 version (e.g., 2)
		// to be interpreted as 1 when migrations are run,
		// resulting in the error
		//
		// https://github.com/wxt-dev/wxt/issues/1775

		return Promise.all([
			setValuePromise,
			this.#storage.setMeta({ v: this.version } as Partial<TMetadata>),
		]);
	}

	protected async setValue(value: ToReadonly<RawState>) {
		this.logger.debug('new value:', value);

		const oldState = await this.#storage.getValue();

		await this.#saveValue(value as RawState);
		const state = (this.#state = this.parseRawValue(value));

		this.#notifyWatchers(state, oldState, true, StorageEventTrigger.SetValue);
	}

	protected async setParsedValue(state: ToReadonly<State>) {
		this.logger.debug('new parsed value:', state);

		const oldState = this.toRawValue(this.#state);

		await this.#saveValue(this.toRawValue(state));
		this.#state = state;

		this.#notifyWatchers(state, oldState, true, StorageEventTrigger.SetValue);
	}

	protected parseRawValue(raw: ToReadonly<RawState>): ToReadonly<State> {
		return raw as unknown as ToReadonly<State>;
	}

	protected toRawValue(parsed: ToReadonly<State>): RawState {
		return parsed as unknown as RawState;
	}

	protected notifyWatcher(
		cb: StorageWatchCallback<State, ListenerArgs> | undefined,
		state: ToReadonly<State>,
		_oldState: RawState | null,
	): void {
		(cb as unknown as StorageWatchCallback<State, []> | undefined)?.(state as ToReadonly<State>);
	}

	[Symbol.dispose]() {
		this.#eventListener[Symbol.dispose]();
		this.#unwatch();
	}
}

export abstract class SyncableStorage<
	Key extends string,
	MetaKey extends `${Key}$`,
	State,
	TMetadata extends StorageMeta & StorageSyncMeta = StorageMeta & StorageSyncMeta,
	RawState = State,
	SyncRawState = RawState,
	ListenerArgs extends unknown[] = [],
> extends StorageBase<Key, MetaKey, State, TMetadata, RawState, ListenerArgs> {
	async getSyncItems(
		syncMeta: StorageSyncMeta,
	): Promise<[shards: StorageShard<'sync'>[], removeKeys: `sync:${string}`[]]> {
		const [state, meta] = await this.getItems();
		const stateValue = this.getSyncValueFromRaw(state.value);

		const syncShards: StorageShard<'sync'>[] = [
			{
				key: `sync:${this.metaKey}`,
				value: {
					...meta.value,
					...syncMeta,
				},
			},
		];
		const removeKeys: `sync:${string}`[] = [];

		if (this instanceof ShardedStorage) {
			const rawShards = await this.shardRawValue(this.key, stateValue);
			this.logger.debug('generated shards', rawShards);

			for (const shard of rawShards) {
				const itemKey = `sync:${shard.key}` as const;

				if (typeof shard.value === 'undefined') {
					removeKeys.push(itemKey);
				} else {
					syncShards.push({
						key: itemKey,
						value: shard.value,
					});
				}
			}
		} else {
			syncShards.push({
				key: `sync:${this.key}`,
				value: stateValue,
			});
		}

		return [syncShards, removeKeys];
	}

	getSyncValueFromRaw(state: RawState): SyncRawState {
		return state as unknown as SyncRawState;
	}

	async getShardsFromSync(
		keepStoragePrefix?: boolean,
	): Promise<[shards: StorageShard<never>[], state: Record<string, unknown>]> {
		const state = await browser.storage.sync.get();

		const shards = filterMap(
			Object.entries(state),
			([key]) => key === this.key,
			([key, value]): StorageShard<never> => ({
				key: keepStoragePrefix ? key : undefined,
				value,
			}),
		);

		return [shards, state];
	}

	async restoreFromSync() {
		const [state, meta] =
			this instanceof ShardedStorage
				? await this.recoverRawValueFromShards()
				: await this.defaultGetRawValueFromSync();

		return {
			[this.key]: state,
			[this.metaKey]: meta,
		};
	}

	getRawValueFromSync(state: SyncRawState): MaybePromise<RawState> {
		return state as unknown as RawState;
	}

	private async defaultGetRawValueFromSync(): Promise<[RawState, TMetadata]> {
		const [state, meta] = await storage.getItems([`sync:${this.key}`, `sync:${this.metaKey}`]);

		const missingKeys: string[] = [];

		for (const { key, value } of [state, meta]) {
			if (typeof value === 'undefined' || value === null) {
				missingKeys.push(key);
			}
		}

		if (missingKeys.length > 0) {
			throw new NoShardsError(missingKeys);
		}

		const stateValue = await this.getRawValueFromSync(state.value);

		return [stateValue, meta.value as TMetadata];
	}
}

export abstract class ShardedStorage<
	Key extends string,
	MetaKey extends `${Key}$`,
	State,
	TMetadata extends StorageMeta & StorageSyncMeta = StorageMeta & StorageSyncMeta,
	RawState = State,
	SyncRawState = RawState,
	ListenerArgs extends unknown[] = [],
> extends SyncableStorage<Key, MetaKey, State, TMetadata, RawState, SyncRawState, ListenerArgs> {
	/**
	 * shards value into the smaller pieces
	 *
	 * can be used to mitigate the standard 8 KB/item sync storage limit
	 *
	 * f.e., on the realistic list of blocked channels I exceeded the limit
	 * on 192 channels with the one-key-per-object approach, and
	 * on 365 channels with the one-key-per-field approach
	 */
	abstract shardRawValue(keyPrefix: string, raw: SyncRawState): MaybePromise<StorageShard<never>[]>;
	abstract getShardsFromSync(
		keepStoragePrefix?: boolean,
	): Promise<[shards: StorageShard<never>[], state: Record<string, unknown>]>;
	abstract recoverRawValueFromShards(): Promise<[RawState, TMetadata]>;
}
