export const symmetricDifference = <T>(a: Iterable<T>, b: Iterable<T>) => {
	const diff = new Set(a);

	for (const el of b) {
		if (diff.has(el)) {
			diff.delete(el);
		} else {
			diff.add(el);
		}
	}

	return diff;
};
