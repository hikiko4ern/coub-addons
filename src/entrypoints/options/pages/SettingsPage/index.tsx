import type { FunctionComponent } from 'preact';

import { ExtensionSettings } from './ExtensionSettings';
import { ImportExport } from './ImportExport';

export const SettingsPage: FunctionComponent = () => (
	<div className="flex flex-wrap gap-4">
		<ExtensionSettings />
		<ImportExport />
	</div>
);
