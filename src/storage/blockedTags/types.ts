import type { PhrasesTree } from './helpers/phrasesToTree';

export interface BlockedTags {
	raw: RawBlockedTags;
	phrases: PhrasesTree;
	regexps: RegExp[];
}

export type RawBlockedTags = string;
