import type { ToReadonly } from '@/types/util';

import { getFirstWord } from './segmenterUtils';

export interface PhrasesTree {
	[word: string]: PhrasesTreeLeaf;
}

export interface PhrasesTreeLeaf {
	phrases: Set<string>;
	rawPositions: Map<string, number>;
}

export const phrasesToTree = (phrases: Iterable<[phrase: string, pos: number]>): PhrasesTree => {
	const tree: PhrasesTree = {};

	for (let [phrase, pos] of phrases) {
		phrase = preparePhraseForTree(phrase);
		const word = getFirstWord(phrase);
		word && addToLeaf((tree[word] ||= newLeaf()), phrase, pos);
	}

	return tree;
};

export const preparePhraseForTree = (phrase: string) => phrase.normalize('NFKC').toLowerCase();

export const addPhraseToTree = (
	tree: ToReadonly<PhrasesTree>,
	phrase: string,
	pos: number,
): ToReadonly<PhrasesTree> => {
	phrase = preparePhraseForTree(phrase);
	const word = getFirstWord(phrase);

	if (!word) {
		return tree;
	}

	const newTree: PhrasesTree = { ...(tree as PhrasesTree) };
	addToLeaf((newTree[word] = copyLeaf(tree[word])), phrase, pos);
	return newTree;
};

const newLeaf = (): PhrasesTreeLeaf => ({
	phrases: new Set(),
	rawPositions: new Map(),
});

const copyLeaf = (leaf: ToReadonly<PhrasesTreeLeaf> | undefined): PhrasesTreeLeaf => ({
	phrases: new Set(leaf?.phrases),
	rawPositions: new Map(leaf?.rawPositions),
});

const addToLeaf = (leaf: PhrasesTreeLeaf, phrase: string, pos: number) => {
	leaf.phrases.add(phrase);
	leaf.rawPositions.has(phrase) || leaf.rawPositions.set(phrase, pos);
};
