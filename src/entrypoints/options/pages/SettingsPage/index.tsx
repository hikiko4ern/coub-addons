import type { FunctionComponent } from 'preact';

import { PerStorageSync } from '@/options/components/PerStorageSync';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';

import { ExtensionSettings } from './ExtensionSettings';
import { ImportExport } from './ImportExport';

export const SettingsPage: FunctionComponent = () => {
	const { settingsStorage } = useLazyStorages();

	return (
		<>
			{/*
				somehow make it clearer that this sync import-export
				applies only to extension settings,
				not to all, like file import-export does
			*/}
			<PerStorageSync className="mb-4" storage={settingsStorage} />

			<div className="flex flex-wrap gap-4">
				<ExtensionSettings />
				<ImportExport />
			</div>
		</>
	);
};
