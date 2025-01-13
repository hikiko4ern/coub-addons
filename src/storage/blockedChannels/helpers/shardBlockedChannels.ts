import { byteSize } from '@/helpers/byteSize';
import { shardArray } from '@/helpers/shards/array';
import { shardUint32 } from '@/helpers/shards/uint32';
import type { Logger } from '@/utils/logger';

import type { RawBlockedChannels } from '../types';

export const shardBlockedChannels = (
	logger: Logger,
	keyPrefix: string,
	raw: RawBlockedChannels,
) => [
	...shardUint32(logger, keyPrefix, 'id', raw.id),
	...shardArray(keyPrefix, 'title', raw.title, byteSize),
	...shardArray(keyPrefix, 'permalink', raw.permalink, byteSize),
];
