// TODO: load lazily
import * as icu from '@coub-addons/segmenter-utils';

import { Logger } from '@/utils/logger';

const logger = Logger.create('segmenter');

export interface WordsBoundaries {
	words: Word[];
	wordBoundaryIndexes: Set<number>;
}

interface Word {
	word: string;
	index: number;
}

let getFirstWord: (input: string) => string | undefined,
	segmentWords: (input: string) => WordsBoundaries | undefined;

if (typeof Intl.Segmenter === 'undefined') {
	logger.debug('using `Intl.Segmenter` polyfill');

	getFirstWord = icu.getFirstWord;
	segmentWords = icu.segmentWords;
} else {
	logger.debug('using native `Intl.Segmenter`');

	const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

	getFirstWord = (input: string) => {
		const first = segmenter.segment(input)[Symbol.iterator]().next();
		return !first.done && first.value.isWordLike ? first.value.segment : undefined;
	};

	segmentWords = (input: string) => {
		const res: WordsBoundaries = {
			words: [],
			wordBoundaryIndexes: new Set(),
		};

		for (const s of segmenter.segment(input)) {
			if (s.isWordLike) {
				res.words.push({
					word: s.segment,
					index: s.index,
				});

				res.wordBoundaryIndexes.add(s.index);
				res.wordBoundaryIndexes.add(s.index + s.segment.length);
			}
		}

		return res.words.length ? res : undefined;
	};
}

export { getFirstWord, segmentWords };
