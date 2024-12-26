import initWasm, { segmentWords as wasm_segmentWords } from '@coub-addons/segmenter-utils';
import createEmojiRegex from 'emoji-regex';

import type { MaybePromise } from '@/types/util';
import { Logger } from '@/utils/logger';

const logger = Logger.create('segmenter');
const wasmUrl = browser.runtime.getURL('segmenter-utils.wasm');

export interface SegmenterUtils {
	segmentWords: (input: string) => string[] | undefined;
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
	const emojiRegex = createEmojiRegex();

	const segmenterUtils: SegmenterUtils = {
		segmentWords: function segmentWords(input: string) {
			const words: string[] = [];

			for (const s of segmenter.segment(input)) {
				if (s.isWordLike || emojiRegex.test(s.segment)) {
					words.push(s.segment);
				}
			}

			return words.length ? words : undefined;
		},
	};

	loadSegmenterUtils = () => segmenterUtils;
}

export { loadSegmenterUtils };
