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

	// will also match phrase `worldo?`
	expect(getMatchedPhrase(segmenterUtils, tree, ['hello worldo!'])).toBeTruthy();
});

it('partial', () => {
	{
		const tree = phrasesToTree(segmenterUtils, ['свою смерть']);
		expect(
			getMatchedPhrase(segmenterUtils, tree, ['еретики примите свою смерть достойно']),
		).toBeTruthy();
	}

	{
		const tree = phrasesToTree(segmenterUtils, ['🥶']);
		expect(getMatchedPhrase(segmenterUtils, tree, ['🥶'])).toBeTruthy();
		expect(getMatchedPhrase(segmenterUtils, tree, ['🥶 winter is coming'])).toBeTruthy();
		expect(getMatchedPhrase(segmenterUtils, tree, ['winter is coming 🥶'])).toBeTruthy();
		expect(getMatchedPhrase(segmenterUtils, tree, ['winter🥶winter'])).toBeTruthy();
		expect(getMatchedPhrase(segmenterUtils, tree, ['winter 🥶 winter'])).toBeTruthy();
	}
});
