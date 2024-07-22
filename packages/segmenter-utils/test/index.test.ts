import { expect, it } from 'vitest';

import { getFirstWord, segmentWords } from '../src/sync';

it('first word', () => {
	expect(getFirstWord('')).toBe(undefined);
	expect(getFirstWord(' \n\t\v ')).toBe(undefined);
	expect(getFirstWord(' word ')).toBe(undefined);
	expect(getFirstWord('Красная Шапочка передаёт привет!')).toBe('Красная');
});

it('segment words', () => {
	expect(segmentWords('Красная Шапочка передаёт привет!')).toStrictEqual({
		wordBoundaryIndexes: new Set([0, 7, 8, 15, 16, 24, 25, 31]),
		words: [
			{
				word: 'Красная',
				index: 0,
			},
			{
				word: 'Шапочка',
				index: 8,
			},
			{
				word: 'передаёт',
				index: 16,
			},
			{
				word: 'привет',
				index: 25,
			},
		],
	});
});
