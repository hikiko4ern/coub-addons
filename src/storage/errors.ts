import type { ReactLocalization } from '@fluent/react';
import type { VNode } from 'preact';

import { FluentList } from '@/translation/intl';

export abstract class TranslatableError extends Error {
	abstract translate(l10n: ReactLocalization): string | VNode;
}

export type MissingShardsKey = [key: string | undefined, indexes: number[]];

export class MissingShardsError extends TranslatableError {
	private missing: string[];

	constructor(missingShards: MissingShardsKey[]) {
		const missing = missingShards.map(([key, indexes]) =>
			key ? `(${key}) ${indexes}` : indexes.join(),
		);

		super(`missing shards for ${missing.join(', ')}`);
		Object.setPrototypeOf(this, new.target.prototype);
		this.missing = missing;
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('missing-backup-shards', {
			missing: new FluentList(this.missing, { type: 'conjunction' }),
		});
}
