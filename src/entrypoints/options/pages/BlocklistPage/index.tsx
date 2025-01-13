import { Localized } from '@fluent/react';
import type { FunctionComponent, VNode } from 'preact';

import { ErrorCode } from '@/options/components/ErrorCode';
import { PerStorageSync } from '@/options/components/PerStorageSync';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';

import { BlocklistSettings } from './components/BlocklistSettings';

export const BlocklistPage: FunctionComponent = () => {
	const { blocklistStorage } = useLazyStorages();
	const blocklist = useStorageState({ storage: blocklistStorage });

	let content: string | VNode;

	switch (blocklist.status) {
		case StorageHookState.Loaded:
			content = <BlocklistSettings storage={blocklistStorage} state={blocklist.data} />;
			break;

		case StorageHookState.Loading:
			content = <Localized id="loading" />;
			break;

		case StorageHookState.Error:
			content = <ErrorCode data={blocklist.error} />;
			break;
	}

	return (
		<>
			<PerStorageSync className="mb-4" storage={blocklistStorage} />

			{content}
		</>
	);
};
