import type { ReactLocalization } from '@fluent/react';

import { FluentList } from '@/translation/intl';

import { TranslatableError } from '../errors';
import type { RawBlockedChannels } from './types';

export type MismatchedBlockedChannelsShardLength = [key: keyof RawBlockedChannels, length: number];

export class MismatchedBlockedChannelsShardsLengths extends TranslatableError {
	private lengths: string[];

	constructor(lengths: MismatchedBlockedChannelsShardLength[]) {
		const len = lengths.map(([key, length]) => `${key}: ${length}`);

		super(`mismatched shards lengths: ${len.join(', ')}`);
		Object.setPrototypeOf(this, new.target.prototype);
		this.lengths = len;
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('mismatched-backup-shards-lengths', {
			lengths: new FluentList(this.lengths, { type: 'conjunction' }),
		});
}
