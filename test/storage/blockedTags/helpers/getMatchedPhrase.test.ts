// cspell:words hewwo, wowwd, worldo

import { expect, it } from 'vitest';

import { getMatchedPhrase } from '@/storage/blockedTags/helpers/getMatchedPhrase';
import { phrasesToTree } from '@/storage/blockedTags/helpers/phrasesToTree';

it('simple', () => {
	const tree = phrasesToTree(['wowwd', 'hewwo wowwd!', 'wowwd hewwo', 'hewwo', 'worldo?']);

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

it('in between', () => {
	const tree = phrasesToTree(['свою смерть']);
	expect(getMatchedPhrase(tree, ['еретики примите свою смерть достойно'])).toBeTruthy();
});
