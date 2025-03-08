import type { StorageShard } from '../base';
import type { PhrasesTree } from './helpers/phrasesTree';

export interface PhrasesBlocklist {
	raw: RawPhrasesBlocklist;
	phrases: PhrasesTree;
	regexps: [re: RegExp, rawPosition: number][];
}

export type RawPhrasesBlocklist = string;

export type MatchedBlocklistPhrase = [pattern: string, rawPosition: number];

export type RawPhrasesBlocklistShards = StorageShard<never, string>[];
