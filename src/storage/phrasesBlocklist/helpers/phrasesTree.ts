import type { ToReadonly } from '@/types/util';
import type { SegmenterUtils } from './segmenterUtils';

export type PhrasesTreeLeaf = {
	[word in string]?: PhrasesTreeLeaf;
} & {
	[lastWord in LAST_WORD]?: string;
};

export interface PhrasesTree {
	[word: string]: PhrasesTreeLeaf;
}

// `structuredClone` does not preserve symbols, so we use a regular string with spaces as a key
// (segmentation separates words by spaces, so this key-marker should not overlap with key-words)
export const LAST_WORD = '#last word#';
export type LAST_WORD = typeof LAST_WORD;

export const phrasesToTree = (utils: SegmenterUtils, phrases: Iterable<string>): PhrasesTree => {
	const tree: PhrasesTree = {};

	for (let phrase of phrases) {
		phrase = preparePhraseForTree(phrase);
		const words = utils.segmentWords(phrase);

		if (words) {
			let leaf: PhrasesTreeLeaf = tree;

			for (const word of words) {
				leaf = leaf[word] ||= {};
			}

			leaf[LAST_WORD] = phrase;
		}
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
	const words = utils.segmentWords(phrase);

	if (!words) {
		return tree;
	}

	const newTree: PhrasesTree = { ...tree };
	let leaf: PhrasesTreeLeaf = newTree;

	for (const word of words) {
		leaf = leaf[word] = word in leaf ? { ...leaf[word] } : {};
	}

	leaf[LAST_WORD] = phrase;

	return newTree;
};
