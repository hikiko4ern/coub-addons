import { Localized } from '@fluent/react';
import type { FunctionComponent } from 'preact';

import { ErrorCode } from '@/options/components/ErrorCode';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';

import { FilteredOutCoubs } from './components/FilteredOutCoubs';

export const StatsPage: FunctionComponent = () => {
	const { statsStorage } = useLazyStorages();
	const stats = useStorageState({ storage: statsStorage });

	switch (stats.status) {
		case StorageHookState.Loaded: {
			return <FilteredOutCoubs data={stats.data.filtered} />;
		}

		case StorageHookState.Loading:
			return <Localized id="loading" />;

		case StorageHookState.Error:
			return <ErrorCode data={stats.error} />;
	}
};
