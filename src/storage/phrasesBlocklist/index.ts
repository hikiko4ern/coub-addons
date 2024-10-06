import type { Asyncify } from 'type-fest';

import type { ToReadonly } from '@/types/util';

import { isPromise } from '@/helpers/isPromise';
import { StorageBase } from '../base';
import type { FnWithState, StorageMeta } from '../types';
import { getMatchedPhrase } from './helpers/getMatchedPhrase';
import { mergePhrasesBlocklist } from './helpers/mergePhrasesBlocklist';
import { parsePhrasesBlocklist } from './helpers/parsePhrasesBlocklist';
import { addPhraseToTree } from './helpers/phrasesTree';
import { type SegmenterUtils, loadSegmenterUtils } from './helpers/segmenterUtils';
import type { PhrasesBlocklist, RawPhrasesBlocklist } from './types';

export type { PhrasesBlocklist, RawPhrasesBlocklist } from './types';

export interface PhrasesBlocklistMeta extends StorageMeta {}

export type ReadonlyPhrasesBlocklist = ToReadonly<PhrasesBlocklist>;

/** if one of values is blocked, returns the pattern by which it is blocked */
export type IsBlockedFn = (value: string | Iterable<string>) => string | undefined;

let segmenterUtils: SegmenterUtils;

export abstract class PhrasesBlocklistStorage<Key extends string> extends StorageBase<
	Key,
	PhrasesBlocklist,
	PhrasesBlocklistMeta,
	RawPhrasesBlocklist
> {
	static readonly merge = mergePhrasesBlocklist;

	initialize() {
		return (this.statePromise = this.loadUtilsThenInitialize());
	}

	private loadUtilsThenInitialize() {
		if (!segmenterUtils) {
			const utilsPromise = loadSegmenterUtils();

			if (isPromise(utilsPromise)) {
				return utilsPromise.then(res => ((segmenterUtils = res), super.initialize()));
			}

			segmenterUtils = utilsPromise;
		}

		return super.initialize();
	}

	isBlocked: Asyncify<IsBlockedFn> = async value => this.#isBlocked(await this.getValue(), value);

	createBoundedIsBlocked = async (): Promise<IsBlockedFn> => {
		const state = await this.getValue();
		return value => this.#isBlocked(state, value);
	};

	block = async (value: string) => {
		const state = await this.getValue();

		!this.#isBlocked(state, value) &&
			this.setParsedValue({
				...state,
				raw: state.raw.endsWith('\n') ? state.raw + value : `${state.raw}\n${value}`,
				phrases: addPhraseToTree(segmenterUtils, state.phrases, value),
			});
	};

	setRaw = (raw: RawPhrasesBlocklist) => this.setValue(raw);

	// TODO: optimize
	#isBlocked: FnWithState<PhrasesBlocklist, IsBlockedFn> = (state, value) => {
		const valuesArr: string[] = typeof value === 'string' ? [value] : Array.from(value);
		const blockedByPhrase = getMatchedPhrase(segmenterUtils, state.phrases, valuesArr);

		if (typeof blockedByPhrase !== 'undefined') {
			return blockedByPhrase;
		}

		for (const v of valuesArr) {
			for (const regex of state.regexps) {
				if (regex.test(v)) {
					return String(regex);
				}
			}
		}
	};

	protected parseRawValue(raw: RawPhrasesBlocklist): PhrasesBlocklist {
		return parsePhrasesBlocklist(this.logger, segmenterUtils, raw);
	}

	protected toRawValue(parsed: ReadonlyPhrasesBlocklist): RawPhrasesBlocklist {
		return parsed.raw;
	}
}
