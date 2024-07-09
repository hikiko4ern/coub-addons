type GuardType<T, P> = P extends (value: unknown, ...args: unknown[]) => value is infer U ? U : T;

export const filterMap = <
	T,
	F extends (item: T, index: number) => boolean,
	M extends (item: GuardType<T, F>, index: number) => unknown,
>(
	arr: Iterable<T>,
	filter: F,
	map: M,
) => Array.from(filterMapIterator(arr, filter, map));

function* filterMapIterator<
	T,
	F extends (item: T, index: number) => boolean,
	M extends (item: GuardType<T, F>, index: number) => unknown,
>(arr: Iterable<T>, filter: F, map: M): Iterable<ReturnType<M>> {
	let i = 0;

	for (const item of arr) {
		if (filter(item, i)) {
			yield map(item as GuardType<T, F>, i) as ReturnType<M>;
		}
		i += 1;
	}
}
