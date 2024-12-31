import type { SegmenterUtils } from './segmenterUtils';

import type { ToReadonly } from '@/types/util';

import type { MatchedBlocklistPhrase } from '../types';
import { type PhrasesTree, preparePhraseForTree } from './phrasesTree';

export const getMatchedPhrase = (
	utils: SegmenterUtils,
	tree: ToReadonly<PhrasesTree>,
	strings: Iterable<string>,
): MatchedBlocklistPhrase | undefined => {
	for (let str of strings) {
		str = preparePhraseForTree(str);

		const strLength = str.length,
			wordsBoundaries = utils.segmentWords(str);

		if (wordsBoundaries) {
			for (const { word, index } of wordsBoundaries.words) {
				const leaf = tree[word];

				if (!leaf) {
					continue;
				}

				for (const phrase of leaf.phrases) {
					if (str.startsWith(phrase, index)) {
						const endIndex = index + phrase.length;

						if (endIndex === strLength || wordsBoundaries.wordBoundaryIndexes.has(endIndex)) {
							return [
								phrase,
								// biome-ignore lint/style/noNonNullAssertion: the found phrase is guaranteed to have a position
								leaf.rawPositions.get(phrase)!,
							];
						}
					}
				}
			}
		}
	}
};
