type GuardType<T, P> = P extends (value: any, ...args: any[]) => value is infer U ? U : T;

export const mapFilter = <
	T,
	M extends (item: T, index: number) => unknown,
	F extends (item: ReturnType<M>, index: number) => boolean,
>(
	arr: Iterable<T>,
	map: M,
	filter: F,
) => Array.from(mapFilterIterator(arr, map, filter));

function* mapFilterIterator<
	T,
	M extends (item: T, index: number) => unknown,
	F extends (item: ReturnType<M>, index: number) => boolean,
>(arr: Iterable<T>, map: M, filter: F): Iterable<GuardType<ReturnType<M>, F>> {
	let i = 0;

	for (const item of arr) {
		const v = map(item, i) as ReturnType<M>;
		if (filter(v, i)) {
			yield v as GuardType<ReturnType<M>, F>;
		}
		i += 1;
	}
}
