import type { ToReadonly } from '@/types/util';
import type { BlockedChannelData, RawBlockedChannels } from '../types';

export function* iterRawBlockedChannels(
	raw: ToReadonly<RawBlockedChannels>,
): Generator<BlockedChannelData, void, unknown> {
	const length = raw.id.length;

	for (let i = 0; i < length; i++) {
		const id = raw.id[i];

		yield {
			id,
			title: raw.title[i],
			permalink: raw.permalink[i],
		};
	}
}
