import { enumerate } from 'itertools';

import type { BlockedChannelData, RawBlockedChannels } from '../types';

export const blockedChannelsToRaw = (iter: Iterable<BlockedChannelData>, newSize: number) => {
	const raw: RawBlockedChannels = {
		id: new Array(newSize),
		permalink: new Array(newSize),
		title: new Array(newSize),
	};

	for (const [i, item] of enumerate(iter)) {
		raw.id[i] = item.id;
		raw.title[i] = item.title;
		raw.permalink[i] = item.permalink;
	}

	return raw;
};
