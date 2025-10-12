import type { Asyncify } from 'type-fest';

import type { ToReadonly } from '@/types/util';

import { StorageBase } from '../base';
import type { FnWithState, StorageMeta } from '../types';
import { getMatchedPhrase } from './helpers/getMatchedPhrase';
import { mergePhrasesBlocklist } from './helpers/mergePhrasesBlocklist';
import { parsePhrasesBlocklist } from './helpers/parsePhrasesBlocklist';
import { addPhraseToTree } from './helpers/phrasesTree';
import type { MatchedBlocklistPhrase, PhrasesBlocklist, RawPhrasesBlocklist } from './types';

export type { PhrasesBlocklist, RawPhrasesBlocklist } from './types';

export interface PhrasesBlocklistMeta extends StorageMeta {}

export type ReadonlyPhrasesBlocklist = ToReadonly<PhrasesBlocklist>;

/** if one of values is blocked, returns the pattern by which it is blocked */
export type IsBlockedFn = (value: string | Iterable<string>) => MatchedBlocklistPhrase | undefined;

export abstract class PhrasesBlocklistStorage<Key extends string> extends StorageBase<
	Key,
	PhrasesBlocklist,
	PhrasesBlocklistMeta,
	RawPhrasesBlocklist
> {
	static readonly merge = mergePhrasesBlocklist;

	isBlocked: Asyncify<IsBlockedFn> = async value => this.#isBlocked(await this.getValue(), value);

	createBoundedIsBlocked = async (): Promise<IsBlockedFn> => {
		const state = await this.getValue();
		return value => this.#isBlocked(state, value);
	};

	block = async (value: string) => {
		const state = await this.getValue();

		if (!this.#isBlocked(state, value)) {
			const newRawWithoutValue = state.raw.endsWith('\n') ? state.raw : `${state.raw}\n`;

			this.setParsedValue({
				...state,
				raw: newRawWithoutValue + value,
				phrases: addPhraseToTree(state.phrases, value, newRawWithoutValue.length),
			});
		}
	};

	setRaw = (raw: RawPhrasesBlocklist) => this.setValue(raw);

	// TODO: optimize
	#isBlocked: FnWithState<PhrasesBlocklist, IsBlockedFn> = (state, value) => {
		const valuesArr: string[] = typeof value === 'string' ? [value] : Array.from(value);
		const blockedByPhrase = getMatchedPhrase(state.phrases, valuesArr);

		if (typeof blockedByPhrase !== 'undefined') {
			return blockedByPhrase;
		}

		for (const v of valuesArr) {
			for (const [regex, pos] of state.regexps) {
				if (regex.test(v)) {
					return [String(regex), pos];
				}
			}
		}
	};

	protected parseRawValue(raw: RawPhrasesBlocklist): PhrasesBlocklist {
		return parsePhrasesBlocklist(this.logger, raw);
	}

	protected toRawValue(parsed: ReadonlyPhrasesBlocklist): RawPhrasesBlocklist {
		return parsed.raw;
	}
}
