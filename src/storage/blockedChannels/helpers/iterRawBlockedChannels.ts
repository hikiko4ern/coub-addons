import type { BlockedChannelData, RawBlockedChannels } from '../types';

export function* iterRawBlockedChannels(
	raw: RawBlockedChannels,
): Generator<[id: number, data: BlockedChannelData], void, unknown> {
	const length = raw.id.length;

	for (let i = 0; i < length; i++) {
		const id = raw.id[i];

		yield [
			id,
			{
				id,
				title: raw.title[i],
				permalink: raw.permalink[i],
			},
		];
	}
}
