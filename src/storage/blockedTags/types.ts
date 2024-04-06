import type { PhrasesTree } from './helpers/phrasesTree';

export interface BlockedTags {
	raw: RawBlockedTags;
	phrases: PhrasesTree;
	regexps: RegExp[];
}

export type RawBlockedTags = string;
