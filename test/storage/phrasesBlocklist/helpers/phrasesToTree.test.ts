// cspell:words hewwo, wowwd, beautifuw

import { permutations } from 'itertools';
import { expect, it } from 'vitest';

import { LAST_WORD, phrasesToTree } from '@/storage/phrasesBlocklist/helpers/phrasesTree';
import { segmenterUtils } from './segmenterUtils';

it('1 word', () => {
	expect(phrasesToTree(segmenterUtils, ['hewwo'])).toStrictEqual({
		hewwo: { [LAST_WORD]: 'hewwo' },
	});

	expect(phrasesToTree(segmenterUtils, ['hewwo!'])).toStrictEqual({
		hewwo: { [LAST_WORD]: 'hewwo!' },
	});

	expect(phrasesToTree(segmenterUtils, ['hewwo', 'hewwo'])).toStrictEqual({
		hewwo: { [LAST_WORD]: 'hewwo' },
	});
});

it('2 words', () => {
	expect(phrasesToTree(segmenterUtils, ['hewwo wowwd'])).toStrictEqual({
		hewwo: {
			wowwd: { [LAST_WORD]: 'hewwo wowwd' },
		},
	});
});

it('3 words', () => {
	expect(phrasesToTree(segmenterUtils, ['hewwo beautifuw wowwd'])).toStrictEqual({
		hewwo: {
			beautifuw: {
				wowwd: { [LAST_WORD]: 'hewwo beautifuw wowwd' },
			},
		},
	});
});

it('1 + 2 words', () => {
	for (const words of permutations(['hewwo', 'hewwo wowwd'])) {
		expect(phrasesToTree(segmenterUtils, words)).toStrictEqual({
			hewwo: {
				[LAST_WORD]: 'hewwo',
				wowwd: { [LAST_WORD]: 'hewwo wowwd' },
			},
		});
	}
});

it('1 + 2 + 3 words', () => {
	for (const words of permutations(['hewwo', 'hewwo wowwd', 'hewwo beautifuw wowwd'])) {
		expect(phrasesToTree(segmenterUtils, words)).toStrictEqual({
			hewwo: {
				[LAST_WORD]: 'hewwo',
				wowwd: { [LAST_WORD]: 'hewwo wowwd' },
				beautifuw: {
					wowwd: { [LAST_WORD]: 'hewwo beautifuw wowwd' },
				},
			},
		});
	}
});

it('sentence', () => {
	const sentence =
		'Кроличья нора сначала была прямая, как тоннель, но потом обрывалась так внезапно';

	expect(phrasesToTree(segmenterUtils, [sentence])).toStrictEqual({
		кроличья: {
			нора: {
				сначала: {
					была: {
						прямая: {
							как: {
								тоннель: {
									но: {
										потом: {
											обрывалась: {
												так: {
													внезапно: { [LAST_WORD]: sentence.toLocaleLowerCase('ru') },
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	});
});

it('many words', () => {
	expect(
		phrasesToTree(segmenterUtils, [
			// I will definitely burn in hell for this
			// cspell:disable-next-line
			'Teh rabbit-hwowal went stwaight on wike a tunnyew fwow swome way (o´∀`o) and when dipped suddenwy dwown (* ^ ω ^) swo suddenwy dat Awice had nyot a mwoment two fwink abwout stwopping hewsewf befwowe she fwound hewsewf fawwing dwown a wewwy deep weww UwU',
		]),
	).toMatchSnapshot();
});
