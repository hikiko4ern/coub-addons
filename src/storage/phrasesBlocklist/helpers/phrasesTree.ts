import type { ToReadonly } from '@/types/util';
import type { SegmenterUtils } from './segmenterUtils';

export interface PhrasesTree {
	[word: string]: Set<string>;
}

export const phrasesToTree = (utils: SegmenterUtils, phrases: Iterable<string>): PhrasesTree => {
	const tree: PhrasesTree = {};

	for (let phrase of phrases) {
		phrase = preparePhraseForTree(phrase);
		const word = utils.getFirstWord(phrase);
		word && (tree[word] ||= new Set()).add(phrase);
	}

	return tree;
};

export const preparePhraseForTree = (phrase: string) => phrase.normalize('NFKC').toLowerCase();

export const addPhraseToTree = (
	utils: SegmenterUtils,
	tree: ToReadonly<PhrasesTree>,
	phrase: string,
): ToReadonly<PhrasesTree> => {
	phrase = preparePhraseForTree(phrase);
	const word = utils.getFirstWord(phrase);

	return word
		? {
				...tree,
				[word]: new Set(tree[word]).add(phrase),
			}
		: tree;
};
