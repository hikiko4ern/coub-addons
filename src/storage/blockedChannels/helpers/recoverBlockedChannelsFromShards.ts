import type { ObjectEntries } from '@/types/util';
import type { Logger } from '@/utils/logger';

import {
	type MismatchedBlockedChannelsShardLength,
	MismatchedBlockedChannelsShardsLengths,
	MissingBlockedChannelsShards,
	type MissingBlockedChannelsShardsKey,
} from '../errors';
import type { RawBlockedChannels, RawBlockedChannelsShards } from '../types';

const KEY_RE = /^(id|title|permalink)(?:#(\d+))?$/;

type RawBlockedChannelsArrays = {
	[key in keyof RawBlockedChannels]: RawBlockedChannels[key][];
};

export const recoverBlockedChannelsFromShards = (
	logger: Logger,
	shards: RawBlockedChannelsShards,
): RawBlockedChannels => {
	const arrays: RawBlockedChannelsArrays = {
		id: [],
		title: [],
		permalink: [],
	};

	for (const { key: fullKey, value } of shards) {
		const match = fullKey.match(KEY_RE);

		if (!match) {
			logger.warn('unmatched shard', fullKey, value);
			continue;
		}

		const [, key, indexStr] = match;
		const index = indexStr ? Number.parseInt(indexStr, 10) : 0;
		arrays[key as keyof RawBlockedChannels][index] = value;
	}

	assertNotSparse(arrays);

	const raw: RawBlockedChannels = {
		id: arrays.id.flat(),
		title: arrays.title.flat(),
		permalink: arrays.permalink.flat(),
	};

	assertLengthsAreEqual(raw);

	return raw;
};

const assertNotSparse = (arrays: RawBlockedChannelsArrays) => {
	const missingShards: MissingBlockedChannelsShardsKey[] = [];

	for (const [key, value] of Object.entries(arrays) as ObjectEntries<typeof arrays>) {
		const indexes = sparseIndexes(value);

		if (indexes.length > 0) {
			missingShards.push([key, indexes]);
		}
	}

	if (missingShards.length > 0) {
		throw new MissingBlockedChannelsShards(missingShards);
	}
};

const sparseIndexes = (arr: unknown[]): number[] => {
	const indexes: number[] = [];

	for (let i = 0, length = arr.length; i < length; i++) {
		if (!(i in arr)) {
			indexes.push(i);
		}
	}

	return indexes;
};

const assertLengthsAreEqual = (raw: RawBlockedChannels) => {
	if (raw.id.length === raw.title.length && raw.title.length === raw.permalink.length) {
		return;
	}

	const shardsLengths: MismatchedBlockedChannelsShardLength[] = [];

	for (const [key, value] of Object.entries(raw) as ObjectEntries<typeof raw>) {
		shardsLengths.push([key, value.length]);
	}

	throw new MismatchedBlockedChannelsShardsLengths(shardsLengths);
};
