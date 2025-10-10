import { it } from 'vitest';

import {
	type Blocklist,
	BlocklistStorage,
	CommentFromBlockedChannelAction,
} from '@/storage/blocklist';

const mergeBlocklist = BlocklistStorage.merge;

const settings: Blocklist = { ...BlocklistStorage.STORAGE.fallback };

it('should merge blocklist', ({ expect }) => {
	const t = (backup: Partial<Blocklist>) =>
		expect(mergeBlocklist({ ...settings }, backup)).toStrictEqual({ ...settings, ...backup });

	t({});

	t({ isBlockRecoubs: true });

	t({ isBlockRepostsOfCoubs: true });

	t({ commentsFromBlockedChannels: CommentFromBlockedChannelAction.RemoveWithReplies });

	t({ isBlockRepostsOfStories: true });

	t({
		isBlockRecoubs: true,
		isBlockRepostsOfCoubs: true,
		isBlockRepostsOfStories: true,
		commentsFromBlockedChannels: CommentFromBlockedChannelAction.RemoveWithReplies,
	});
});
