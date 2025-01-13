import { ShardGenerator } from './gen';
import { PER_KEY_BYTES_LIMIT, getBaseLength } from './shardUtils';

export const shardArray = <T>(
	keyPrefix: string,
	key: string,
	values: T[],
	getByteSize = (value: string) => String(value).length,
) => {
	const baseLength = getBaseLength(keyPrefix, key) + 2; // +2 for the array brackets []

	const shards = new ShardGenerator<T[]>(key);
	let shardValues: T[] = [],
		nextIndex = 0,
		length = baseLength;

	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		const commaLength = +(nextIndex > 0); // +1 for the comma between pairs of values
		let valueLength = getByteSize(JSON.stringify(value)) + commaLength;
		const newLength = length + valueLength;

		if (newLength >= PER_KEY_BYTES_LIMIT) {
			valueLength -= commaLength; // remove the comma since we start a new array
			length = baseLength + valueLength;
			shards.push(shardValues);
			shardValues = [];
		} else {
			length = newLength;
		}

		nextIndex = shardValues.push(value);
	}

	if (shardValues.length > 0) {
		shards.push(shardValues);
	}

	return shards.finish();
};
