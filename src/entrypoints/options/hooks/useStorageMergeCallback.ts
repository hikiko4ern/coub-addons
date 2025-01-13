import { useCallback } from 'preact/hooks';

interface Storage<State extends object> {
	mergeWith(value: Partial<State>): Promise<void>;
}

export const useStorageMergeCallback = <State extends object, Key extends keyof State>(
	storage: Storage<State>,
	key: Key,
	onChange?: (value: NoInfer<State[Key]>) => void,
) => {
	const onChangeRef = useWatchingRef(onChange);

	return useCallback(
		(value: State[Key]) => {
			storage.mergeWith({ [key]: value } as State);
			typeof onChangeRef.current === 'function' && onChangeRef.current(value);
		},
		[storage, key],
	);
};
