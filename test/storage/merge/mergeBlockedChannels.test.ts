import { it } from 'vitest';

import type { RawBlockedChannels } from '@/storage/blockedChannels';
import { mergeBlockedChannels } from '@/storage/blockedChannels/helpers/mergeBlockedChannels';

const emptyValue: RawBlockedChannels = {
	id: [],
	title: [],
	permalink: [],
};

const filledValue: RawBlockedChannels = {
	id: [1, 2, 3],
	title: ['a', 'b', 'c'],
	permalink: ['ca', 'cb', 'cc'],
};

const copy = (value: RawBlockedChannels) => (): RawBlockedChannels =>
	JSON.parse(JSON.stringify(value));

const empty = copy(emptyValue);
const filled = copy(filledValue);

it('should merge blocked channels', ({ expect }) => {
	expect(mergeBlockedChannels(empty(), emptyValue)).toStrictEqual(emptyValue);
	expect(mergeBlockedChannels(empty(), filledValue)).toStrictEqual(filledValue);
	expect(mergeBlockedChannels(filled(), emptyValue)).toStrictEqual(filledValue);
	expect(mergeBlockedChannels(filled(), filledValue)).toStrictEqual(filledValue);

	expect(
		mergeBlockedChannels(filled(), {
			id: [3, 5, 1, 2, 4],
			title: ['c', 'e', 'a', 'b', 'd'],
			permalink: ['cc', 'ce', 'ca', 'cb', 'cd'],
		}),
	).toStrictEqual({
		id: [1, 2, 3, 5, 4],
		title: ['a', 'b', 'c', 'e', 'd'],
		permalink: ['ca', 'cb', 'cc', 'ce', 'cd'],
	});
});
