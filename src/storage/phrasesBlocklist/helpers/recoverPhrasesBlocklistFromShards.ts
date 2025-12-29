import { arraySparseIndexes } from '@/helpers/arraySparseIndexes';
import { recoverArrayShard } from '@/helpers/shards/array';
import type { Logger } from '@/utils/logger';

import { MissingShardsError } from '../../errors';
import type { RawPhrasesBlocklist, RawPhrasesBlocklistShards } from '../types';

const KEY_RE = /^#(\d+)$/;

export const recoverPhrasesBlocklistFromShards = async (
	logger: Logger,
	shards: RawPhrasesBlocklistShards,
): Promise<RawPhrasesBlocklist> => {
	const arrays: string[][] = [];

	for (const { key: fullKey, value: rawValue } of shards) {
		let index: number;

		if (typeof fullKey === 'undefined') {
			index = 0;
		} else {
			const match = fullKey.match(KEY_RE);

			if (!match) {
				logger.warn('unmatched shard', fullKey, rawValue);
				continue;
			}

			const [, indexStr] = match;
			index = indexStr ? Number.parseInt(indexStr, 10) : 0;
		}

		if (typeof rawValue === 'undefined' || rawValue === null) {
			logger.info('skipping empty shard (probably failed to remove?)', { index, rawValue });
			continue;
		}

		arrays[index] = await recoverArrayShard<string>(logger, rawValue);
	}

	assertNotSparse(arrays);

	return arrays.flat().join('\n');
};

const assertNotSparse = (arrays: string[][]) => {
	const indexes = arraySparseIndexes(arrays);

	if (indexes.length > 0) {
		throw new MissingShardsError([[undefined, indexes]]);
	}
};
