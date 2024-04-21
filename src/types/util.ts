import type { ReadonlyDeep } from 'type-fest';

export type ToReadonly<T> = T extends Map<infer Key, infer Value>
	? ReadonlyMap<Key, Value>
	: ReadonlyDeep<T>;

export type GuardType<T, P> = P extends (value: unknown, ...args: unknown[]) => value is infer U
	? U
	: T;

export type Value<T> = T extends ReadonlySet<infer U> ? U : T;
