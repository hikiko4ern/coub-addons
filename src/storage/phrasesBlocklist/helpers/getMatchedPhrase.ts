import type { SegmenterUtils } from './segmenterUtils';

import type { ToReadonly } from '@/types/util';

import { type PhrasesTree, preparePhraseForTree } from './phrasesTree';

export const getMatchedPhrase = (
	utils: SegmenterUtils,
	tree: ToReadonly<PhrasesTree>,
	strings: Iterable<string>,
) => {
	for (let str of strings) {
		str = preparePhraseForTree(str);

		const strLength = str.length,
			wordsBoundaries = utils.segmentWords(str);

		if (wordsBoundaries) {
			for (const { word, index } of wordsBoundaries.words) {
				const phrases = tree[word];

				if (!phrases) {
					continue;
				}

				for (const phrase of phrases) {
					if (str.startsWith(phrase, index)) {
						const endIndex = index + phrase.length;

						if (endIndex === strLength || wordsBoundaries.wordBoundaryIndexes.has(endIndex)) {
							return phrase;
						}
					}
				}
			}
		}
	}
};
