import type { Asyncify } from 'type-fest';

import type { ToReadonly } from '@/types/util';
import type { Logger } from '@/utils/logger';

import { StorageBase } from '../base';
import type { FnWithState, StorageMeta } from '../types';
import { getMatchedPhrase } from './helpers/getMatchedPhrase';
import { parseBlockedTags } from './helpers/parseBlockedTags';
import type { BlockedTags, RawBlockedTags } from './types';

export type { BlockedTags, RawBlockedTags } from './types';

export interface BlockedTagsMeta extends StorageMeta {}

export type ReadonlyBlockedTags = ToReadonly<BlockedTags>;

const key = 'blockedTags' as const;

const defaultValue: RawBlockedTags = '';

const tagsItem = storage.defineItem<RawBlockedTags, BlockedTagsMeta>(`local:${key}`, {
	version: 1,
	defaultValue,
});

export type IsHaveBlockedTagsFn = (tags: Iterable<string>) => string | undefined;

export class BlockedTagsStorage extends StorageBase<
	typeof key,
	BlockedTags,
	BlockedTagsMeta,
	RawBlockedTags
> {
	static readonly KEY = key;
	protected readonly logger: Logger;

	constructor(tabId: number | undefined, source: string, logger: Logger) {
		const childLogger = logger.getChildLogger(new.target.name);
		super(tabId, source, childLogger, new.target.KEY, tagsItem);
		Object.setPrototypeOf(this, new.target.prototype);
		this.logger = childLogger;
	}

	isBlocked: Asyncify<IsHaveBlockedTagsFn> = async tags =>
		this.#isBlocked(await this.getValue(), tags);

	createBoundedIsBlocked = async (): Promise<IsHaveBlockedTagsFn> => {
		const state = await this.getValue();
		return tags => this.#isBlocked(state, tags);
	};

	setRaw = (raw: RawBlockedTags) => this.setValue(raw);

	// TODO: optimize
	#isBlocked: FnWithState<BlockedTags, IsHaveBlockedTagsFn> = (state, tags) => {
		const tagsArr = Array.from(tags);
		const blockedByPhrase = getMatchedPhrase(state.phrases, tagsArr);

		if (typeof blockedByPhrase !== 'undefined') {
			return blockedByPhrase;
		}

		for (const tag of tagsArr) {
			for (const regex of state.regexps) {
				if (regex.test(tag)) {
					return String(regex);
				}
			}
		}
	};

	protected parseRawValue(raw: RawBlockedTags): BlockedTags {
		return parseBlockedTags(this.logger, raw);
	}

	protected toRawValue(parsed: ReadonlyBlockedTags): RawBlockedTags {
		return parsed.raw;
	}
}
