// cspell:words hewwo, wowwd, worldo

import { expect, it } from 'vitest';

import { getMatchedPhrase } from '@/storage/phrasesBlocklist/helpers/getMatchedPhrase';
import { parsePhrasesBlocklist } from '@/storage/phrasesBlocklist/helpers/parsePhrasesBlocklist';

const parseTree = (raw: string) => parsePhrasesBlocklist(console, raw).phrases;

it('simple', () => {
	const tree = parseTree(`\
wowwd
hewwo wowwd!
wowwd hewwo
hewwo
worldo?`);

	// will match phrase `hewwo`
	expect(getMatchedPhrase(tree, ['hello', 'hewwo'])).toBeTruthy();

	// will match phrase `hewwo wowwd!`
	expect(getMatchedPhrase(tree, ['---hewwo wowwd!'])).toBeTruthy();

	// will match phrase `wowwd`
	expect(getMatchedPhrase(tree, ['---hewwo wowwd?'])).toBeTruthy();

	// will match phrase `worldo?`
	expect(getMatchedPhrase(tree, ['hello worldo?'])).toBeTruthy();

	// will NOT match phrase `worldo?`
	expect(getMatchedPhrase(tree, ['hello worldo!'])).toBeFalsy();
});

it('partial', () => {
	{
		const tree = parseTree('свою смерть');
		expect(getMatchedPhrase(tree, ['еретики примите свою смерть достойно'])).toBeTruthy();
	}

	{
		const tree = parseTree('🥶');
		expect(getMatchedPhrase(tree, ['🥶'])).toBeTruthy();
		expect(getMatchedPhrase(tree, ['🥶 winter is coming'])).toBeTruthy();
		expect(getMatchedPhrase(tree, ['winter is coming 🥶'])).toBeTruthy();
		expect(getMatchedPhrase(tree, ['winter🥶winter'])).toBeTruthy();
		expect(getMatchedPhrase(tree, ['winter 🥶 winter'])).toBeTruthy();
	}
});
