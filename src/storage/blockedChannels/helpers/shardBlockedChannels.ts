import { byteSize } from '@/helpers/byteSize';
import { shardArray } from '@/helpers/shards/array';
import { shardUint32 } from '@/helpers/shards/uint32';
import type { Logger } from '@/utils/logger';

import type { RawBlockedChannels } from '../types';

export const shardBlockedChannels = async (
	logger: Logger,
	keyPrefix: string,
	raw: RawBlockedChannels,
) =>
	Promise.all([
		shardUint32(logger, keyPrefix, 'id', raw.id),
		// TODO: allow to omit `title` and/or `permalink` from the sync export
		shardArray(keyPrefix, 'title', raw.title, 'string', byteSize),
		shardArray(keyPrefix, 'permalink', raw.permalink, 'string', byteSize),
	]).then(arr => arr.flat());
