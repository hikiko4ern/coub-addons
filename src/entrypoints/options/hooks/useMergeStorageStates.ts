import { useMemo } from 'preact/hooks';

import type { ToReadonly } from '@/types/util';

import { StorageHookState, type StorageState } from './useStorageState';

type StorageStates = Record<string, Readonly<StorageState<any>>>;
type MergedStorageStates<States extends StorageStates> = {
	[key in keyof States]: States[key] extends Readonly<StorageState<infer Data>>
		? ToReadonly<Data>
		: never;
};

export const useMergeStorageStates = <States extends StorageStates>(states: States) => {
	const keys = useMemo(() => Object.keys(states) as (keyof States)[], []);

	const deps = useMemo(() => keys.map(key => states[key]), [states]);

	return useMemo((): StorageState<MergedStorageStates<States>> => {
		const errors: unknown[] = [];
		const merged = {} as MergedStorageStates<States>;

		for (const [i, state] of deps.entries()) {
			switch (state.status) {
				case StorageHookState.Loading:
					return state;

				case StorageHookState.Error:
					errors.push(state.error);
					break;

				case StorageHookState.Loaded: {
					const key = keys[i];
					merged[key] = state.data;
					break;
				}
			}
		}

		if (errors.length) {
			return {
				status: StorageHookState.Error,
				error: new AggregateError(errors),
			};
		}

		return {
			status: StorageHookState.Loaded,
			data: merged as ToReadonly<typeof merged>,
		};
	}, deps);
};
