import type { SegmenterUtils } from './segmenterUtils';

import type { ToReadonly } from '@/types/util';

import {
	LAST_WORD,
	type PhrasesTree,
	type PhrasesTreeLeaf,
	preparePhraseForTree,
} from './phrasesTree';

export const getMatchedPhrase = (
	utils: SegmenterUtils,
	tree: ToReadonly<PhrasesTree>,
	strings: Iterable<string>,
) => {
	for (let str of strings) {
		str = preparePhraseForTree(str);

		const words = utils.segmentWords(str);

		if (words) {
			const matchedPhrase = findPhraseInTree(tree, words);

			if (matchedPhrase) {
				return matchedPhrase;
			}
		}
	}
};

const findPhraseInTree = (tree: PhrasesTree, words: string[]): string | undefined => {
	const wordsLen = words.length;

	byWords: for (let i = 0; i < wordsLen; i++) {
		let leaf: PhrasesTreeLeaf | undefined = tree;

		for (let j = i; j < wordsLen; j++) {
			const word = words[j];
			leaf = leaf[word];

			if (!leaf) {
				continue byWords;
			}

			const lastWord = leaf[LAST_WORD];

			if (lastWord) {
				return lastWord;
			}
		}
	}
};
