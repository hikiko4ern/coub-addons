import { it } from 'vitest';

import { type Blocklist, BlocklistStorage } from '@/storage/blocklist';

const mergeBlocklist = BlocklistStorage.merge;

const settings: Blocklist = { ...BlocklistStorage.STORAGE.fallback };

it('should merge blocklist', ({ expect }) => {
	const t = (backup: Partial<Blocklist>) =>
		expect(mergeBlocklist({ ...settings }, backup)).toStrictEqual({ ...settings, ...backup });

	t({});

	t({ isBlockRecoubs: true });

	t({ isHideCommentsFromBlockedChannels: false });

	t({ isBlockRepostsOfStories: true });

	t({
		isBlockRecoubs: true,
		isHideCommentsFromBlockedChannels: false,
		isBlockRepostsOfStories: true,
	});
});
