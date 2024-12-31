// cspell:words hewwo, wowwd, beautifuw

import { permutations } from 'itertools';
import { expect, it } from 'vitest';

import { phrasesToTree } from '@/storage/phrasesBlocklist/helpers/phrasesTree';
import { segmenterUtils } from './segmenterUtils';

it('1 word', () => {
	expect(phrasesToTree(segmenterUtils, ['🥶'])).toStrictEqual({
		'🥶': new Set(['🥶']),
	});

	expect(phrasesToTree(segmenterUtils, ['hewwo'])).toStrictEqual({
		hewwo: new Set(['hewwo']),
	});

	expect(phrasesToTree(segmenterUtils, ['hewwo!'])).toStrictEqual({
		hewwo: new Set(['hewwo!']),
	});

	expect(phrasesToTree(segmenterUtils, ['hewwo', 'hewwo'])).toStrictEqual({
		hewwo: new Set(['hewwo']),
	});
});

it('2 words', () => {
	expect(phrasesToTree(segmenterUtils, ['hewwo wowwd'])).toStrictEqual({
		hewwo: new Set(['hewwo wowwd']),
	});

	expect(phrasesToTree(segmenterUtils, ['🥶winter'])).toStrictEqual({
		'🥶': new Set(['🥶winter']),
	});

	expect(phrasesToTree(segmenterUtils, ['🥶 winter'])).toStrictEqual({
		'🥶': new Set(['🥶 winter']),
	});

	expect(phrasesToTree(segmenterUtils, ['winter🥶'])).toStrictEqual({
		winter: new Set(['winter🥶']),
	});

	expect(phrasesToTree(segmenterUtils, ['winter 🥶'])).toStrictEqual({
		winter: new Set(['winter 🥶']),
	});
});

it('3 words', () => {
	expect(phrasesToTree(segmenterUtils, ['hewwo beautifuw wowwd'])).toStrictEqual({
		hewwo: new Set(['hewwo beautifuw wowwd']),
	});
});

it('1 + 2 words', () => {
	for (const words of permutations(['hewwo', 'hewwo wowwd'])) {
		expect(phrasesToTree(segmenterUtils, words)).toStrictEqual({
			hewwo: new Set(['hewwo', 'hewwo wowwd']),
		});
	}
});

it('1 + 2 + 3 words', () => {
	for (const words of permutations(['hewwo', 'hewwo wowwd', 'hewwo beautifuw wowwd'])) {
		expect(phrasesToTree(segmenterUtils, words)).toStrictEqual({
			hewwo: new Set(['hewwo', 'hewwo wowwd', 'hewwo beautifuw wowwd']),
		});
	}
});

it('sentence', () => {
	expect(
		phrasesToTree(segmenterUtils, [
			'Кроличья нора сначала была прямая, как тоннель, но потом обрывалась так внезапно',
		]),
	).toStrictEqual({
		кроличья: new Set([
			'кроличья нора сначала была прямая, как тоннель, но потом обрывалась так внезапно',
		]),
	});
});

it('many words', () => {
	expect(
		phrasesToTree(segmenterUtils, [
			// I will definitely burn in hell for this
			// cspell:disable-next-line
			'Teh rabbit-hwowal went stwaight on wike a tunnyew fwow swome way (o´∀`o) and when dipped suddenwy dwown (* ^ ω ^) swo suddenwy dat Awice had nyot a mwoment two fwink abwout stwopping hewsewf befwowe she fwound hewsewf fawwing dwown a wewwy deep weww UwU',
		]),
	).toStrictEqual({
		// cspell:disable
		teh: new Set([
			'teh rabbit-hwowal went stwaight on wike a tunnyew fwow swome way (o´∀`o) and when dipped suddenwy dwown (* ^ ω ^) swo suddenwy dat awice had nyot a mwoment two fwink abwout stwopping hewsewf befwowe she fwound hewsewf fawwing dwown a wewwy deep weww uwu'.normalize(
				'NFKC',
			),
		]),
		// cspell:enable
	});
});
