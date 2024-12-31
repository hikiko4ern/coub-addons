// cspell:words hewwo, wowwd, worldo

import { expect, it } from 'vitest';

import { getMatchedPhrase } from '@/storage/phrasesBlocklist/helpers/getMatchedPhrase';
import { parsePhrasesBlocklist } from '@/storage/phrasesBlocklist/helpers/parsePhrasesBlocklist';
import { segmenterUtils } from './segmenterUtils';

const parseTree = (raw: string) => parsePhrasesBlocklist(console, segmenterUtils, raw).phrases;

it('simple', () => {
	const tree = parseTree(`\
wowwd
hewwo wowwd!
wowwd hewwo
hewwo
worldo?`);

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

it('partial', () => {
	{
		const tree = parseTree('свою смерть');
		expect(
			getMatchedPhrase(segmenterUtils, tree, ['еретики примите свою смерть достойно']),
		).toBeTruthy();
	}

	{
		const tree = parseTree('🥶');
		expect(getMatchedPhrase(segmenterUtils, tree, ['🥶'])).toBeTruthy();
		expect(getMatchedPhrase(segmenterUtils, tree, ['🥶 winter is coming'])).toBeTruthy();
		expect(getMatchedPhrase(segmenterUtils, tree, ['winter is coming 🥶'])).toBeTruthy();
		expect(getMatchedPhrase(segmenterUtils, tree, ['winter🥶winter'])).toBeTruthy();
		expect(getMatchedPhrase(segmenterUtils, tree, ['winter 🥶 winter'])).toBeTruthy();
	}
});
