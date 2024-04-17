import type { PhrasesTree } from './helpers/phrasesTree';

export interface PhrasesBlocklist {
	raw: RawPhrasesBlocklist;
	phrases: PhrasesTree;
	regexps: RegExp[];
}

export type RawPhrasesBlocklist = string;
