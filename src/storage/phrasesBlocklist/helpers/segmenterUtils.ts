import createEmojiRegex from 'emoji-regex';

export interface WordsBoundaries {
	words: Word[];
	wordBoundaryIndexes: Set<number>;
}

interface Word {
	word: string;
	index: number;
}

const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
const emojiRegex = createEmojiRegex();

const isWordLikeSegment = (data: Intl.SegmentData) =>
	data.isWordLike || ((emojiRegex.lastIndex = 0), emojiRegex.test(data.segment));

export const getFirstWord = (input: string): string | undefined => {
	const first = segmenter.segment(input)[Symbol.iterator]().next();
	return !first.done && isWordLikeSegment(first.value) ? first.value.segment : undefined;
};

export const segmentWords = (input: string): WordsBoundaries | undefined => {
	const res: WordsBoundaries = {
		words: [],
		wordBoundaryIndexes: new Set(),
	};

	for (const s of segmenter.segment(input)) {
		if (isWordLikeSegment(s)) {
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
