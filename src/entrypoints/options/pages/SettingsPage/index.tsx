import type { FunctionComponent } from 'preact';

import { PerStorageSync } from '@/options/components/PerStorageSync';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';

import { ExtensionSettings } from './ExtensionSettings';
import { ImportExport } from './ImportExport';
import { SyncSettings } from './SyncSettings';

export const SettingsPage: FunctionComponent = () => {
	const { settingsStorage } = useLazyStorages();

	return (
		<>
			<PerStorageSync className="mb-4" storage={settingsStorage} />

			<div className="flex flex-wrap gap-4">
				<ExtensionSettings />
				<SyncSettings />
				<ImportExport />
			</div>
		</>
	);
};
