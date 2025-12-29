import { arraySparseIndexes } from '@/helpers/arraySparseIndexes';
import { recoverArrayShard } from '@/helpers/shards/array';
import { recoverUint32Shard } from '@/helpers/shards/uint32';
import { MissingShardsError, type MissingShardsKey } from '@/storage/errors';
import type { ObjectEntries } from '@/types/util';
import type { Logger } from '@/utils/logger';

import {
	type MismatchedBlockedChannelsShardLength,
	MismatchedBlockedChannelsShardsLengths,
} from '../errors';
import type { RawBlockedChannels, RawBlockedChannelsShards } from '../types';

const KEY_RE = /^(id|title|permalink)(?:#(\d+))?$/;

type RawBlockedChannelsArrays = {
	[key in keyof RawBlockedChannels]: RawBlockedChannels[key][];
};

export const recoverBlockedChannelsFromShards = async (
	logger: Logger,
	shards: RawBlockedChannelsShards,
): Promise<RawBlockedChannels> => {
	const arrays: RawBlockedChannelsArrays = {
		id: [],
		title: [],
		permalink: [],
	};

	for (const { key: fullKey, value: rawValue } of shards) {
		const match = fullKey.match(KEY_RE);

		if (!match) {
			logger.warn('unmatched shard', fullKey, rawValue);
			continue;
		}

		const [, _key, indexStr] = match;
		const key = _key as keyof RawBlockedChannels;
		const index = indexStr ? Number.parseInt(indexStr, 10) : 0;

		if (typeof rawValue === 'undefined' || rawValue === null) {
			logger.info('skipping empty shard (probably failed to remove?)', { key, index, rawValue });
			continue;
		}

		let value: RawBlockedChannels[keyof RawBlockedChannels];

		switch (key) {
			case 'id':
				value = await recoverUint32Shard(logger, rawValue);
				break;

			case 'title':
			case 'permalink':
				value = await recoverArrayShard<string>(logger, rawValue);
				break;
		}

		arrays[key][index] = value;
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
	const missingShards: MissingShardsKey[] = [];

	for (const [key, value] of Object.entries(arrays) as ObjectEntries<typeof arrays>) {
		const indexes = arraySparseIndexes(value);

		if (indexes.length > 0) {
			missingShards.push([key, indexes]);
		}
	}

	if (missingShards.length > 0) {
		throw new MissingShardsError(missingShards);
	}
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
