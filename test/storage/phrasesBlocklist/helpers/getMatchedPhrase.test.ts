// cspell:words hewwo, wowwd, worldo

import { expect, it } from 'vitest';

import { getMatchedPhrase } from '@/storage/phrasesBlocklist/helpers/getMatchedPhrase';
import { phrasesToTree } from '@/storage/phrasesBlocklist/helpers/phrasesTree';
import { segmenterUtils } from './segmenterUtils';

it('simple', () => {
	const tree = phrasesToTree(segmenterUtils, [
		'wowwd',
		'hewwo wowwd!',
		'wowwd hewwo',
		'hewwo',
		'worldo?',
	]);

	// will match phrase `hewwo`
	expect(getMatchedPhrase(segmenterUtils, tree, ['hello', 'hewwo'])).toBeTruthy();

	// will match phrase `hewwo wowwd!`
	expect(getMatchedPhrase(segmenterUtils, tree, ['---hewwo wowwd!'])).toBeTruthy();

	// will match phrase `wowwd`
	expect(getMatchedPhrase(segmenterUtils, tree, ['---hewwo wowwd?'])).toBeTruthy();

	// will match phrase `worldo?`
	expect(getMatchedPhrase(segmenterUtils, tree, ['hello worldo?'])).toBeTruthy();

	// will NOT match phrase `worldo?`
	expect(getMatchedPhrase(segmenterUtils, tree, ['hello worldo!'])).toBeFalsy();
});

it('in between', () => {
	const tree = phrasesToTree(segmenterUtils, ['свою смерть']);
	expect(
		getMatchedPhrase(segmenterUtils, tree, ['еретики примите свою смерть достойно']),
	).toBeTruthy();
});
