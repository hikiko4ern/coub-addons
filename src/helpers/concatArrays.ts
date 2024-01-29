export const concatArrays = (arrays: readonly Uint8Array[]) => {
	let length = 0;

	for (const arr of arrays) {
		length += arr.length;
	}

	const merged = new Uint8Array(length);
	let offset = 0;

	for (const arr of arrays) {
		merged.set(arr, offset);
		offset += arr.length;
	}

	return merged;
};
