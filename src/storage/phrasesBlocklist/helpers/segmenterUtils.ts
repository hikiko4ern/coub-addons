import initWasm, {
	getFirstWord as wasm_getFirstWord,
	segmentWords as wasm_segmentWords,
} from '@coub-addons/segmenter-utils';

import type { MaybePromise } from '@/types/util';
import { Logger } from '@/utils/logger';

const logger = Logger.create('segmenter');
const wasmUrl = browser.runtime.getURL('segmenter-utils.wasm');

export interface WordsBoundaries {
	words: Word[];
	wordBoundaryIndexes: Set<number>;
}

interface Word {
	word: string;
	index: number;
}

export interface SegmenterUtils {
	getFirstWord: (input: string) => string | undefined;
	segmentWords: (input: string) => WordsBoundaries | undefined;
}

let loadSegmenterUtils: () => MaybePromise<SegmenterUtils>;

if (typeof Intl.Segmenter === 'undefined') {
	logger.debug('using `Intl.Segmenter` polyfill');

	let initPromise: Promise<SegmenterUtils> | undefined;
	let segmenterUtils: SegmenterUtils | undefined;

	loadSegmenterUtils = () =>
		(initPromise ||= initWasm(wasmUrl).then((): SegmenterUtils => {
			logger.debug('successfully loaded from', wasmUrl);

			segmenterUtils = {
				getFirstWord: wasm_getFirstWord,
				segmentWords: wasm_segmentWords,
			};

			// biome-ignore lint/style/noNonNullAssertion: it's guaranteed to be already loaded
			loadSegmenterUtils = () => segmenterUtils!;

			return segmenterUtils;
		})).catch((err: unknown) => {
			logger.error('failed to load from', wasmUrl, err);
			throw err;
		});
} else {
	logger.debug('using native `Intl.Segmenter`');

	const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

	const segmenterUtils: SegmenterUtils = {
		getFirstWord: function getFirstWord(input) {
			const first = segmenter.segment(input)[Symbol.iterator]().next();
			return !first.done && first.value.isWordLike ? first.value.segment : undefined;
		},
		segmentWords: function segmentWords(input: string) {
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
		},
	};

	loadSegmenterUtils = () => segmenterUtils;
}

export { loadSegmenterUtils };
