import type { Unwatch, WxtStorageItem } from 'wxt/storage';

import { EventDispatcher, EventListener } from '@/events';
import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';
import { type StorageEvent, StorageEventTrigger, type StorageMeta } from './types';

export type StorageWatchCallback<State, ListenerArgs extends unknown[] = []> = (
	state: ToReadonly<State>,
	...args: ListenerArgs
) => void;

export abstract class StorageBase<
	Key extends string,
	State,
	TMetadata extends StorageMeta = StorageMeta,
	RawState = State,
	ListenerArgs extends unknown[] = [],
> implements Disposable
{
	protected abstract readonly logger: Logger;

	readonly #key;
	readonly #storage;
	readonly #source;
	readonly #tabId;
	readonly #watchers = new Set<StorageWatchCallback<State, ListenerArgs>>();
	readonly #unwatch: Unwatch;
	readonly #eventListener: EventListener;
	#statePromise: Promise<ToReadonly<State>> | undefined;
	#state!: ToReadonly<State>;

	constructor(
		tabId: number | undefined,
		source: string,
		logger: Logger,
		key: Key,
		storage: WxtStorageItem<RawState, TMetadata>,
	) {
		this.#tabId = tabId;
		this.#source = source;
		this.#key = key;
		this.#storage = storage;

		this.initialize();

		this.#unwatch = this.#storage.watch((_state, oldState) => {
			const state = this.parseRawValue(_state as ToReadonly<RawState>);
			this.#state = state;
			this.#notifyWatchers(state, oldState, false);
		});

		this.#eventListener = new EventListener(logger, msg => {
			if (msg.type !== 'StorageUpdatedEvent' || msg.data.key !== this.#key) {
				return;
			}

			const isOutsideUpdate = msg.data.source !== this.#source || msg.data.tabId !== this.#tabId;

			if (isOutsideUpdate || msg.data.trigger === StorageEventTrigger.SetValue) {
				if (isOutsideUpdate) {
					// we don't have to clone `state` as it's already `structuredClone` (and also it's immutable)
					// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities#data_cloning_algorithm
					this.#state = msg.data.state as ToReadonly<State>;
				}

				this.#notifyWatchers(this.#state, msg.data.oldState as RawState | null, false);
			}
		});
	}

	initialize() {
		return (this.#statePromise = this.#storage
			.getValue()
			.then(res => {
				const state = (this.#state = this.parseRawValue(res as ToReadonly<RawState>));
				this.logger.debug('initialized with state', state, 'from raw', res);
				return state;
			})
			.finally(() => (this.#statePromise = undefined)));
	}

	async reinitialize() {
		const oldState = this.toRawValue(await this.getValue());
		const state = await this.initialize();
		this.#notifyWatchers(state, oldState, true, StorageEventTrigger.SetValue);
	}

	getValue() {
		if (this.#statePromise) {
			return this.#statePromise;
		}

		return this.#state;
	}

	watch(cb: StorageWatchCallback<State, ListenerArgs>): Unwatch {
		this.#watchers.add(cb);
		return () => void this.#watchers.delete(cb);
	}

	clear() {
		return this.setValue(structuredClone(this.#storage.defaultValue) as ToReadonly<RawState>);
	}

	#notifyWatchers(
		state: ToReadonly<State>,
		oldState: RawState | null,
		isDispatchEvent: boolean,
		eventTrigger?: StorageEventTrigger,
	) {
		this.logger.debug('notifying watchers', { state, oldState, watchers: this.#watchers });

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
				key: this.#key,
				state,
				oldState,
				trigger: eventTrigger,
			} as StorageEvent);
	}

	protected async setValue(value: ToReadonly<RawState>) {
		this.logger.debug('new value:', value);

		const oldState = (await this.#storage.getValue()) as RawState | null;

		await this.#storage.setValue(value as RawState);
		const state = (this.#state = this.parseRawValue(value));

		this.#notifyWatchers(state, oldState, true, StorageEventTrigger.SetValue);
	}

	protected async setParsedValue(state: ToReadonly<State>) {
		this.logger.debug('new parsed value:', state);

		const oldState = this.toRawValue(this.#state);

		await this.#storage.setValue(this.toRawValue(state));
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
