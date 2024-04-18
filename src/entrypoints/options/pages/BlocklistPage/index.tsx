import { Localized } from '@fluent/react';
import type { FunctionComponent } from 'preact';

import { ErrorCode } from '@/options/components/ErrorCode';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';

import { BlocklistSettings } from './components/BlocklistSettings';

export const BlocklistPage: FunctionComponent = () => {
	const { blocklistStorage } = useLazyStorages();
	const blocklist = useStorageState({ storage: blocklistStorage });

	switch (blocklist.status) {
		case StorageHookState.Loaded:
			return <BlocklistSettings storage={blocklistStorage} state={blocklist.data} />;

		case StorageHookState.Loading:
			return <Localized id="loading" />;

		case StorageHookState.Error:
			return <ErrorCode data={blocklist.error} />;
	}
};
