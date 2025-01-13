import type { ReactLocalization } from '@fluent/react';

import { FluentList } from '@/translation/intl';

import { TranslatableError } from '../errors';
import type { RawBlockedChannels } from './types';

export type MissingBlockedChannelsShardsKey = [key: keyof RawBlockedChannels, indexes: number[]];

export class MissingBlockedChannelsShards extends TranslatableError {
	private missing: string[];

	constructor(missingShards: MissingBlockedChannelsShardsKey[]) {
		const missing = missingShards.map(([key, indexes]) => `(${key}) ${indexes}`);

		super(`missing shards for ${missing.join(', ')}`);
		Object.setPrototypeOf(this, new.target.prototype);
		this.missing = missing;
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('missing-backup-shards', {
			missing: new FluentList(this.missing, { type: 'conjunction' }),
		});
}

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
