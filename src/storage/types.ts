import type { StorageBase } from './base';
import type { BlockedChannelsStorage } from './blockedChannels';
import type { StatsStorage } from './stats';

export enum StorageEventTrigger {
	SetValue = 'setValue',
}

export type StorageEvent = ToStorageEvent<BlockedChannelsStorage> | ToStorageEvent<StatsStorage>;

interface StorageEventBase<Key extends string, State, RawState> {
	source: string;
	key: Key;
	state: State;
	oldState: RawState | null;
	trigger?: StorageEventTrigger;
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here
export type ToStorageEvent<T extends StorageBase<string, any, any, any, any>> =
	// biome-ignore lint/suspicious/noExplicitAny: `any` is required here
	T extends StorageBase<infer Key, infer State, any, infer RawState, any>
		? StorageEventBase<Key, State, RawState>
		: never;
