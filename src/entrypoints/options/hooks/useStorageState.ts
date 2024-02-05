import { useEffect, useMemo, useState } from 'preact/hooks';

import { isPromise } from '@/helpers/isPromise';
import { usePrevious } from '@/hooks/usePrevious';
import { useWatchingRef } from '@/hooks/useWatchingRef';
import type { StorageBase } from '@/storage/base';
import type { StorageMeta } from '@/storage/types';
import type { ToReadonly } from '@/types/util';

export enum StorageHookState {
	Loading = 0,
	Loaded = 1,
	Error = 2,
}

type InnerState<State> =
	| { status: StorageHookState.Loading }
	| { status: StorageHookState.Loaded; data: ToReadonly<State> }
	| { status: StorageHookState.Error; error: unknown };

interface Options<
	Key extends string,
	State,
	TMetadata extends StorageMeta,
	RawState,
	ListenerArgs extends unknown[],
> {
	storage: StorageBase<Key, State, TMetadata, RawState, ListenerArgs>;
	onInit?: (state: ToReadonly<State>) => void;
	onUpdate?: (state: ToReadonly<State>, ...args: ListenerArgs) => void;
}

export const useStorageState = <
	Key extends string,
	State,
	TMetadata extends StorageMeta,
	RawState,
	ListenerArgs extends unknown[],
>({
	storage,
	onInit,
	onUpdate,
}: Options<Key, State, TMetadata, RawState, ListenerArgs>): Readonly<InnerState<State>> => {
	const initialValue = useMemo(() => storage.getValue(), []);
	const [state, setState] = useState<InnerState<State>>(() =>
		isPromise(initialValue)
			? { status: StorageHookState.Loading }
			: { status: StorageHookState.Loaded, data: initialValue as ToReadonly<State> },
	);
	const prevState = usePrevious(state);
	const onInitRef = onInit ? useWatchingRef(onInit) : undefined;
	const onUpdateRef = onUpdate ? useWatchingRef(onUpdate) : undefined;

	useEffect(() => {
		state.status === StorageHookState.Loading &&
			(initialValue as Exclude<typeof initialValue, ToReadonly<State>>)
				.then(data => {
					setState({ status: StorageHookState.Loaded, data });
					onInitRef?.current(data);
				})
				.catch((error: unknown) => setState({ status: StorageHookState.Error, error }));

		return storage.watch((state, ...args) => {
			setState({ status: StorageHookState.Loaded, data: state });
			onUpdateRef?.current(state, ...args);
		});
	}, []);

	useEffect(() => {
		if (
			state.status === StorageHookState.Loaded &&
			(!prevState || prevState.status !== StorageHookState.Loaded)
		) {
			onInitRef?.current(state.data);
		}
	}, [state, prevState]);

	return state;
};
