import { expect, it } from 'vitest';

import { segmentWords } from '../src/sync';

it('segment words', () => {
	expect(segmentWords('')).toStrictEqual(undefined);
	expect(segmentWords(' \n\t\v ')).toStrictEqual(undefined);
	expect(segmentWords(' word ')).toStrictEqual(['word']);
	expect(segmentWords('winter is coming 🥶')).toStrictEqual(['winter', 'is', 'coming', '🥶']);
	expect(segmentWords('Красная Шапочка передаёт привет!')).toStrictEqual([
		'Красная',
		'Шапочка',
		'передаёт',
		'привет',
	]);
});
