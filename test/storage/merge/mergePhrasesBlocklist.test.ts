// spell-checker: ignore zxc

import { it } from 'vitest';

import { mergePhrasesBlocklist } from '@/storage/phrasesBlocklist/helpers/mergePhrasesBlocklist';

it('should merge phrases blocklist', ({ expect }) => {
	expect(mergePhrasesBlocklist('', '')).toEqual('');

	expect(mergePhrasesBlocklist('test\nabcd', '')).toEqual('test\nabcd');
	expect(mergePhrasesBlocklist('test\nabcd\n', '')).toEqual('test\nabcd\n');

	expect(mergePhrasesBlocklist('test\nabcd', 'test')).toEqual('test\nabcd');
	expect(mergePhrasesBlocklist('test\nabcd', 'test\n')).toEqual('test\nabcd');
	expect(mergePhrasesBlocklist('test\nabcd\n', 'test')).toEqual('test\nabcd\n');
	expect(mergePhrasesBlocklist('test\nabcd\n', 'test\n')).toEqual('test\nabcd\n');

	expect(mergePhrasesBlocklist('test\nabcd', 'abcd')).toEqual('test\nabcd');
	expect(mergePhrasesBlocklist('test\nabcd', 'abcd\n')).toEqual('test\nabcd');
	expect(mergePhrasesBlocklist('test\nabcd\n', 'abcd')).toEqual('test\nabcd\n');
	expect(mergePhrasesBlocklist('test\nabcd\n', 'abcd\n')).toEqual('test\nabcd\n');

	expect(mergePhrasesBlocklist('test\nabcd', 'zxc')).toEqual('test\nabcd\nzxc');
	expect(mergePhrasesBlocklist('test\nabcd', 'zxc\n')).toEqual('test\nabcd\nzxc');
	expect(mergePhrasesBlocklist('test\nabcd\n', 'zxc')).toEqual('test\nabcd\nzxc');
	expect(mergePhrasesBlocklist('test\nabcd\n', 'zxc\n')).toEqual('test\nabcd\nzxc');

	expect(mergePhrasesBlocklist('test\n\nabcd', 'zxc\n\nqwerty')).toEqual(
		'test\n\nabcd\nzxc\n\nqwerty',
	);
});
