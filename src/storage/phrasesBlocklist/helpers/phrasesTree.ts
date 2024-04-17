import type { ToReadonly } from '@/types/util';
import { getFirstWord } from './segmenter';

export interface PhrasesTree {
	[word: string]: Set<string>;
}

export const phrasesToTree = (phrases: Iterable<string>): PhrasesTree => {
	const tree: PhrasesTree = {};

	for (let phrase of phrases) {
		phrase = preparePhraseForTree(phrase);
		const word = getFirstWord(phrase);
		word && (tree[word] ||= new Set()).add(phrase);
	}

	return tree;
};

export const preparePhraseForTree = (phrase: string) => phrase.normalize('NFKC').toLowerCase();

export const addPhraseToTree = (
	tree: ToReadonly<PhrasesTree>,
	phrase: string,
): ToReadonly<PhrasesTree> => {
	phrase = preparePhraseForTree(phrase);
	const word = getFirstWord(phrase);

	return word
		? {
				...tree,
				[word]: new Set(tree[word]).add(phrase),
			}
		: tree;
};
