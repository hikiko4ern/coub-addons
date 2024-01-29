import { Localized } from '@fluent/react';
import type { FunctionComponent } from 'preact';

import { ErrorCode } from '@/options/components/ErrorCode';
import { logger } from '@/options/constants';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';
import { StatsStorage } from '@/storage/stats';

import { FilteredOutCoubs } from './components/FilteredOutCoubs';

let statsStorage: StatsStorage;

export const Stats: FunctionComponent = () => {
	const stats = useStorageState({
		storage: (statsStorage ||= new StatsStorage('options', logger)),
	});

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
