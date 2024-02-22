import type { ToReadonly } from '@/types/util';
import type { StorageBase } from './base';
import type { BlockedChannelsStorage } from './blockedChannels';
import type { StatsStorage } from './stats';

export interface StorageMeta {
	v: number;
	[index: string]: unknown;
}

export enum StorageEventTrigger {
	SetValue = 'setValue',
}

export type StorageEvent = ToStorageEvent<BlockedChannelsStorage> | ToStorageEvent<StatsStorage>;

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here
export type FnWithState<State, Fn extends (...args: any[]) => any> = (
	state: ToReadonly<State>,
	...args: Parameters<Fn>
) => ReturnType<Fn>;

interface StorageEventBase<Key extends string, State, RawState> {
	tabId: number | undefined;
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
