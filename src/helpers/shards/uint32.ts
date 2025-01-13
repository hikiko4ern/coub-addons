import type { ReactLocalization } from '@fluent/react';
import { decode as decodeBase64, encode as encodeBase64 } from 'base64-arraybuffer';

import type { StorageShard } from '@/storage/base';
import { TranslatableError } from '@/storage/errors';
import type { Logger } from '@/utils/logger';

import { shardArray } from './array';
import { ShardGenerator } from './gen';
import { PER_KEY_BYTES_LIMIT, getBaseLength } from './shardUtils';

const MAX_U32 = 2 ** 32 - 1;
const U32_SIZE = Uint32Array.BYTES_PER_ELEMENT;

enum Uint32ShardType {
	// `base64` of the little-endian `Uint32Array`
	BASE64 = 'b64:',
}

const MAX_PREFIX_LENGTH = Math.max(...Object.values(Uint32ShardType).map(p => p.length));

export type Uint32Shard<Value> = StorageShard<never, Value>;

/** shards the `uint32` array */
export const shardUint32 = (logger: Logger, keyPrefix: string, key: string, values: number[]) => {
	const nonU32 = values.find(v => v < 0 || v > MAX_U32);

	if (typeof nonU32 === 'number') {
		logger.error(key, 'contains non-uint32', nonU32, 'in', values);
		return shardArray(keyPrefix, key, values);
	}

	return asBase64(keyPrefix, key, values);
};

/** recovers the `uint32` array from shard */
export const recoverUint32Shard = (value: unknown): number[] => {
	if (Array.isArray(value)) {
		// it was JSON-stringified
		return value;
	}

	if (typeof value === 'string') {
		const prefix = value.slice(0, MAX_PREFIX_LENGTH);

		switch (prefix) {
			case Uint32ShardType.BASE64:
				return fromBase64(value.slice(prefix.length));

			default:
				throw new UnknownUint32Prefix(prefix, value);
		}
	}

	throw new UnknownUint32Value(typeof value, JSON.stringify(value));
};

const asBase64 = (keyPrefix: string, key: string, values: number[]) => {
	const valuePrefix = Uint32ShardType.BASE64;
	const baseLength = getBaseLength(keyPrefix, key) + 2 + valuePrefix.length; // +2 for the string quotes ""

	/** maximum amount of `uint32` that can fit into one key when converted to a base64 string */
	const capacity = Math.floor(((PER_KEY_BYTES_LIMIT - baseLength) * 3) / 4 / U32_SIZE);

	const shards = new ShardGenerator<`${typeof valuePrefix}${string}`>(key);

	for (let i = 0, length = values.length; i < length; i += capacity) {
		const chunk = values.slice(i, i + capacity);
		const buf = new ArrayBuffer(chunk.length * U32_SIZE);

		{
			const view = new DataView(buf);

			for (
				let j = 0, offset = 0, chunkLength = chunk.length;
				j < chunkLength;
				j++, offset += U32_SIZE
			) {
				view.setUint32(offset, chunk[j], true);
			}
		}

		shards.push(`${valuePrefix}${encodeBase64(buf)}`);
	}

	return shards.finish();
};

const fromBase64 = (value: string) => {
	const buf = decodeBase64(value);

	if (buf.byteLength % U32_SIZE !== 0) {
		throw new InvalidUint32BufferSize(buf.byteLength);
	}

	const length = buf.byteLength / U32_SIZE,
		arr = new Array(length),
		view = new DataView(buf);

	for (let i = 0, offset = 0; i < length; i++, offset += U32_SIZE) {
		arr[i] = view.getUint32(offset, true);
	}

	return arr;
};

export class UnknownUint32Prefix extends TranslatableError {
	constructor(
		private prefix: string,
		value: string,
	) {
		super(`unknown Uint32 prefix ${prefix} of value ${value}`);
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('unknown-uint32-prefix', { prefix: this.prefix });
}

export class InvalidUint32BufferSize extends TranslatableError {
	constructor(private size: number) {
		super(`Uint32 buffer size ${size} is invalid`);
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('invalid-uint32-buffer-size', { size: this.size });
}

export class UnknownUint32Value extends TranslatableError {
	constructor(
		private type: string,
		private value: string,
	) {
		super(`unknown Uint32 value of type ${type}: ${value}`);
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('unknown-uint32-value', { type: this.type, value: this.value });
}
