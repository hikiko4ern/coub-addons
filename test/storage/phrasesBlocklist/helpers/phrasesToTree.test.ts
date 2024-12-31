// cspell:words hewwo, wowwd, beautifuw

import { permutations } from 'itertools';
import { expect, it } from 'vitest';

import { parsePhrasesBlocklist } from '@/storage/phrasesBlocklist/helpers/parsePhrasesBlocklist';
import { preparePhraseForTree } from '@/storage/phrasesBlocklist/helpers/phrasesTree';
import { segmenterUtils } from './segmenterUtils';

const parseTree = (raw: string) => parsePhrasesBlocklist(console, segmenterUtils, raw).phrases;

type expected = ReturnType<typeof parseTree>;

it('1 word', () => {
	expect(parseTree('🥶')).toStrictEqual({
		'🥶': {
			phrases: new Set(['🥶']),
			rawPositions: new Map([['🥶', 0]]),
		},
	} satisfies expected);

	expect(parseTree('hewwo')).toStrictEqual({
		hewwo: {
			phrases: new Set(['hewwo']),
			rawPositions: new Map([['hewwo', 0]]),
		},
	} satisfies expected);

	expect(parseTree('hewwo!')).toStrictEqual({
		hewwo: {
			phrases: new Set(['hewwo!']),
			rawPositions: new Map([['hewwo!', 0]]),
		},
	} satisfies expected);

	expect(parseTree('hewwo\nhewwo')).toStrictEqual({
		hewwo: {
			phrases: new Set(['hewwo']),
			rawPositions: new Map([['hewwo', 0]]),
		},
	} satisfies expected);
});

it('2 words', () => {
	expect(parseTree('hewwo wowwd')).toStrictEqual({
		hewwo: {
			phrases: new Set(['hewwo wowwd']),
			rawPositions: new Map([['hewwo wowwd', 0]]),
		},
	} satisfies expected);

	expect(parseTree('🥶winter')).toStrictEqual({
		'🥶': {
			phrases: new Set(['🥶winter']),
			rawPositions: new Map([['🥶winter', 0]]),
		},
	} satisfies expected);

	expect(parseTree('🥶 winter')).toStrictEqual({
		'🥶': {
			phrases: new Set(['🥶 winter']),
			rawPositions: new Map([['🥶 winter', 0]]),
		},
	} satisfies expected);

	expect(parseTree('winter🥶')).toStrictEqual({
		winter: {
			phrases: new Set(['winter🥶']),
			rawPositions: new Map([['winter🥶', 0]]),
		},
	} satisfies expected);

	expect(parseTree('winter 🥶')).toStrictEqual({
		winter: {
			phrases: new Set(['winter 🥶']),
			rawPositions: new Map([['winter 🥶', 0]]),
		},
	} satisfies expected);
});

it('3 words', () => {
	expect(parseTree('hewwo beautifuw wowwd')).toStrictEqual({
		hewwo: {
			phrases: new Set(['hewwo beautifuw wowwd']),
			rawPositions: new Map([['hewwo beautifuw wowwd', 0]]),
		},
	} satisfies expected);
});

it('1 + 2 words', () => {
	for (const [a, b] of permutations(['hewwo', 'hewwo wowwd'])) {
		expect(parseTree(`${a}\n${b}`)).toStrictEqual({
			hewwo: {
				phrases: new Set(['hewwo', 'hewwo wowwd']),
				rawPositions: new Map([
					[a, 0],
					[b, 1 + a.length],
				]),
			},
		} satisfies expected);
	}
});

it('1 + 2 + 3 words', () => {
	for (const [a, b, c] of permutations(['hewwo', 'hewwo wowwd', 'hewwo beautifuw wowwd'])) {
		expect(parseTree(`${a}\n${b}\n${c}`)).toStrictEqual({
			hewwo: {
				phrases: new Set(['hewwo', 'hewwo wowwd', 'hewwo beautifuw wowwd']),
				rawPositions: new Map([
					[a, 0],
					[b, 1 + a.length],
					[c, 2 + a.length + b.length],
				]),
			},
		} satisfies expected);
	}
});

it('sentence', () => {
	const normalized =
		'кроличья нора сначала была прямая, как тоннель, но потом обрывалась так внезапно';

	expect(
		parseTree('Кроличья нора сначала была прямая, как тоннель, но потом обрывалась так внезапно'),
	).toStrictEqual({
		кроличья: {
			phrases: new Set([normalized]),
			rawPositions: new Map([[normalized, 0]]),
		},
	} satisfies expected);
});

it('many words', () => {
	// I will definitely burn in hell for this
	const input =
		// cspell:disable-next-line
		'Teh rabbit-hwowal went stwaight on wike a tunnyew fwow swome way (o´∀`o) and when dipped suddenwy dwown (* ^ ω ^) swo suddenwy dat Awice had nyot a mwoment two fwink abwout stwopping hewsewf befwowe she fwound hewsewf fawwing dwown a wewwy deep weww UwU';

	const normalized = preparePhraseForTree(input);

	expect(parseTree(input)).toStrictEqual({
		// cspell:disable
		teh: {
			phrases: new Set([normalized]),
			rawPositions: new Map([[normalized, 0]]),
		},
		// cspell:enable
	} satisfies expected);
});
