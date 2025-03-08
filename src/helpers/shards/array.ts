import type { ReactLocalization } from '@fluent/react';
import { decode as decodeBase64, encode as encodeBase64 } from 'base64-arraybuffer';
import type { JsonValue } from 'type-fest';

import { TranslatableError } from '@/storage/errors';
import type { ExtendableFromKeys, MaybePromise } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { PER_KEY_BYTES_LIMIT } from './constants';
import { ShardGenerator } from './generator';

const BASE64_BYTES_LIMIT = Math.floor((PER_KEY_BYTES_LIMIT * 3) / 4);

interface EncoderValue {
	generic: JsonValue;
	string: string;
}

enum ArrayShardType {
	// `base64` of the `gzip`-compressed `JSON.stringify`
	GZIP = 'gz:',
}

const MAX_PREFIX_LENGTH = Math.max(...Object.values(ArrayShardType).map(p => p.length));

export const shardArray = <T, Encoder extends ExtendableFromKeys<EncoderValue, T>>(
	keyPrefix: string,
	key: string | undefined,
	values: T[],
	encoder: Encoder,
	getByteSize = (value: string) => value.length,
) => {
	const noInferEncoder = encoder as keyof EncoderValue;

	switch (noInferEncoder) {
		case 'generic':
			return asGeneric(
				keyPrefix,
				key,
				values as EncoderValue[typeof noInferEncoder][],
				getByteSize,
			);

		case 'string':
			return asGzip(keyPrefix, key, values as EncoderValue[typeof noInferEncoder][], getByteSize);
	}
};

/** recovers the array from shard */
export const recoverArrayShard = <T>(logger: Logger, value: unknown): MaybePromise<T[]> => {
	logger.debug('recovering array shard', value);

	if (Array.isArray(value)) {
		// it was JSON-stringified
		return value;
	}

	if (typeof value === 'string') {
		const prefix = value.slice(0, MAX_PREFIX_LENGTH);

		switch (prefix) {
			case ArrayShardType.GZIP:
				return fromGzip(logger, value.slice(prefix.length));

			default: {
				const err = new UnknownArrayPrefix(prefix, value);
				logger.error(err);
				throw err;
			}
		}
	}

	throw new UnknownArrayValue(typeof value, JSON.stringify(value));
};

const asGeneric = <T extends EncoderValue['generic']>(
	keyPrefix: string,
	key: string | undefined,
	values: T[],
	getByteSize: (value: string) => number,
) => {
	const shards = new ShardGenerator<T[]>(keyPrefix, key),
		baseLength = shards.baseLength + 2; // +2 for the array brackets []

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

const textEncoder = new TextEncoder();

const asGzip = async (
	keyPrefix: string,
	key: string | undefined,
	values: EncoderValue['string'][],
	getByteSize: (value: string) => number,
) => {
	const valuePrefix = ArrayShardType.GZIP,
		shards = new ShardGenerator<`${typeof valuePrefix}${string}`>(keyPrefix, key),
		baseLength = shards.baseLength + 2 + valuePrefix.length + 2, // +2 for the string quotes "",
		//                                                              +2 for the array brackets []
		capacity = BASE64_BYTES_LIMIT - baseLength,
		valuesLength = values.length;

	const INITIAL_SHARD_VALUE = '[';
	let shardValue = INITIAL_SHARD_VALUE,
		isNotFirst = false,
		length = baseLength;

	const compressShard = async (values: string) => {
		const valuesStream = new ReadableStream({
			start(controller) {
				controller.enqueue(textEncoder.encode(values));
				controller.close();
			},
		});

		const compressedBuf = await new Response(
			valuesStream.pipeThrough(new CompressionStream('gzip')),
		).arrayBuffer();

		return `${valuePrefix}${encodeBase64(compressedBuf)}` as const;
	};

	for (let i = 0; i < valuesLength; i++) {
		const value = values[i];
		const commaLength = +isNotFirst; // +1 for the comma between pairs of values
		const valueJson = JSON.stringify(value);
		let valueLength = getByteSize(valueJson) + commaLength;
		const newLength = length + valueLength;

		// TODO: currently the data size is calculated based on the size before compression,
		//       so keys capacity is not fully utilized (e.g. if values are 7000 bytes in size,
		//       they will be split into two keys even if they could fit into one of ~6100 bytes
		//       after compression)
		if (newLength >= capacity) {
			valueLength -= commaLength; // remove the comma since we start a new array
			length = baseLength + valueLength;
			shards.push(await compressShard(shardValue + ']'));
			shardValue = INITIAL_SHARD_VALUE + valueJson;
		} else {
			isNotFirst && (shardValue += ',');
			shardValue += valueJson;
			length = newLength;
		}

		isNotFirst = true;
	}

	if (isNotFirst) {
		shards.push(await compressShard(shardValue + ']'));
	}

	return shards.finish();
};

const textDecoder = new TextDecoder('utf8', { fatal: true });

const fromGzip = async (logger: Logger, value: string) => {
	const compressedStream = new ReadableStream({
		start(controller) {
			controller.enqueue(decodeBase64(value));
			controller.close();
		},
	});

	const decompressedBuf = await new Response(
		compressedStream.pipeThrough(new DecompressionStream('gzip')),
	).arrayBuffer();

	const decompressed = textDecoder.decode(decompressedBuf);

	logger.debug('decompressed array', decompressed);

	return JSON.parse(decompressed);
};

export class UnknownArrayPrefix extends TranslatableError {
	constructor(
		private prefix: string,
		value: string,
	) {
		super(`unknown array prefix ${prefix} of value ${value}`);
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('unknown-array-prefix', { prefix: this.prefix });
}

export class UnknownArrayValue extends TranslatableError {
	constructor(
		private type: string,
		private value: string,
	) {
		super(`unknown array value of type ${type}: ${value}`);
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('unknown-array-value', { type: this.type, value: this.value });
}
