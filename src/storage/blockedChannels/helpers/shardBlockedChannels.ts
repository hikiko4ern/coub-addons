import type { IterableElement } from 'type-fest';

import type { StorageShard } from '@/storage/base';

import type { RawBlockedChannels } from '../types';

const PER_KEY_BYTES_LIMIT = 8192; // 8 KB

const encoder = new TextEncoder();

export const shardBlockedChannels = (keyPrefix: string, raw: RawBlockedChannels) => [
	...shard(keyPrefix, 'id', raw.id),
	...shard(keyPrefix, 'title', raw.title),
	...shard(keyPrefix, 'permalink', raw.permalink),
];

interface ArrayShard<T> extends StorageShard<never> {
	value: T[];
}

const shard = <Key extends keyof RawBlockedChannels>(
	keyPrefix: string,
	key: Key,
	values: RawBlockedChannels[NoInfer<Key>],
): StorageShard<never>[] => {
	type Element = IterableElement<RawBlockedChannels[Key]>;

	// biome-ignore format: keep this explanation nicely formatted
	const baseLength = byteSize(`${keyPrefix}${key}`)  + 4       + 2; // constant common length excluding data, so in `"prefix:key#000":[]` it would be:
	//                 ^ prefix + key                        ^ #000    ^
	//                 \                                     \         \- array brackets [] (note that quotation around the key ("") and colon (:) are not counted in length)
	//                  \                                     \
	//                   \                                     \- sequence number prefixed by # (three digits because there can be only 512 keys in the sync storage)
	//                    \- length of key

	const batches: ArrayShard<Element>[] = [{ key: `${key}#000`, value: [] }];
	let batchIndex = 0,
		lastBatch = batches[0],
		nextIndexInLastBatch = 0,
		length = baseLength;

	for (let i = 0; i < values.length; i++) {
		const value = values[i] as Element;
		const commaLength = +(nextIndexInLastBatch > 0); // +1 for the comma between pairs of values
		let valueLength = byteSize(JSON.stringify(value)) + commaLength;
		const newLength = length + valueLength;

		if (newLength >= PER_KEY_BYTES_LIMIT) {
			valueLength -= commaLength; // remove the comma since we start a new array
			length = baseLength + valueLength;
			lastBatch = { key: `${key}#${String(++batchIndex).padStart(3, '0')}`, value: [] };
			batches.push(lastBatch);
		} else {
			length = newLength;
		}

		nextIndexInLastBatch = lastBatch.value.push(value);
	}

	if (lastBatch.value.length === 0) {
		batches.length -= 1;
		lastBatch = batches[--batchIndex];
	}

	// compact key if there is only one batch
	if (batches.length === 1) {
		lastBatch.key = key;
	}

	return batches;
};

const byteSize = (str: string): number => encoder.encode(str).length;
