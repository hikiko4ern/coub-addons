import { Localized } from '@fluent/react';
import { Checkbox } from '@nextui-org/checkbox';
import type { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';

import type { BlocklistStorage, ReadonlyBlocklist } from '@/storage/blocklist';

interface Props {
	storage: BlocklistStorage;
	state: ReadonlyBlocklist;
}

export const BlocklistSettings: FunctionComponent<Props> = ({ storage, state }) => {
	const handleIsBlockRecoubsChange = useCallback(
		(isBlockRecoubs: boolean) => storage.mergeWith({ isBlockRecoubs }),
		[storage],
	);

	return (
		<div>
			<Checkbox isSelected={state.isBlockRecoubs} onValueChange={handleIsBlockRecoubsChange}>
				<Localized id="block-recoubs" />
			</Checkbox>
		</div>
	);
};
