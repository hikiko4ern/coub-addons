import { Localized } from '@fluent/react';
import { Checkbox } from '@nextui-org/checkbox';
import type { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';

import type { Blocklist, BlocklistStorage, ReadonlyBlocklist } from '@/storage/blocklist';

interface Props {
	storage: BlocklistStorage;
	state: ReadonlyBlocklist;
}

const useMergeCallback = <Key extends keyof Blocklist>(storage: BlocklistStorage, key: Key) =>
	useCallback((value: Blocklist[Key]) => storage.mergeWith({ [key]: value }), [storage, key]);

export const BlocklistSettings: FunctionComponent<Props> = ({ storage, state }) => {
	const handleIsBlockRecoubsChange = useMergeCallback(storage, 'isBlockRecoubs');

	const handleIsBlockRepostsOfStoriesChange = useMergeCallback(storage, 'isBlockRepostsOfStories');

	const handleIsHideCommentsFromBlockedChannelsChange = useMergeCallback(
		storage,
		'isHideCommentsFromBlockedChannels',
	);

	return (
		<div className="flex flex-col flex-wrap gap-4">
			<Checkbox isSelected={state.isBlockRecoubs} onValueChange={handleIsBlockRecoubsChange}>
				<Localized id="block-recoubs" />
			</Checkbox>

			<Checkbox
				isSelected={state.isBlockRepostsOfStories}
				onValueChange={handleIsBlockRepostsOfStoriesChange}
			>
				<Localized id="block-reposts-of-stories" />
			</Checkbox>

			<Checkbox
				isSelected={state.isHideCommentsFromBlockedChannels}
				onValueChange={handleIsHideCommentsFromBlockedChannelsChange}
			>
				<Localized id="hide-comments-from-blocked-channels" />
			</Checkbox>
		</div>
	);
};
