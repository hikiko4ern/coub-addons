import { Localized, useLocalization } from '@fluent/react';
import type { FunctionComponent } from 'preact';

import { ErrorCode } from '@/options/components/ErrorCode';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';

import { FilteredOutSection } from './components/FilteredOutSection';

export const StatsPage: FunctionComponent = () => {
	const { l10n } = useLocalization();
	const { statsStorage } = useLazyStorages();
	const stats = useStorageState({ storage: statsStorage });

	switch (stats.status) {
		case StorageHookState.Loaded:
			return (
				<div className="flex flex-wrap gap-4">
					<FilteredOutSection
						title={<Localized id="filtered-out-coubs" />}
						aria-label={l10n.getString('statistics-of-filtered-out-coubs')}
						data={stats.data.filteredCoubs}
					/>

					<FilteredOutSection
						title={<Localized id="filtered-out-comments" />}
						aria-label={l10n.getString('statistics-of-filtered-out-comments')}
						data={stats.data.filteredComments}
					/>
				</div>
			);

		case StorageHookState.Loading:
			return <Localized id="loading" />;

		case StorageHookState.Error:
			return <ErrorCode data={stats.error} />;
	}
};
