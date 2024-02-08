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

export const preparePhraseForTree = (phrase: string) => phrase.toLowerCase();
