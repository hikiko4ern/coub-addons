export const arraySparseIndexes = (arr: unknown[]): number[] => {
	const indexes: number[] = [];

	for (let i = 0, length = arr.length; i < length; i++) {
		if (!(i in arr)) {
			indexes.push(i);
		}
	}

	return indexes;
};
