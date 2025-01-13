import { Localized } from '@fluent/react';
import { Input } from '@nextui-org/input';
import type { FunctionComponent } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { useDebouncedCallback } from 'use-debounce';

import { CardSection } from '@/options/components/CardSection';
import { ErrorCode } from '@/options/components/ErrorCode';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import { useStorageMergeCallback } from '@/options/hooks/useStorageMergeCallback';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';

export const SyncSettings: FunctionComponent = () => {
	const { settingsStorage } = useLazyStorages();

	const [deviceName, setDeviceName] = useState<string>('');
	const settings = useStorageState({
		storage: settingsStorage,
		onInit: settings => setDeviceName(settings.deviceName),
	});

	const saveDeviceName = useDebouncedCallback(
		useStorageMergeCallback(settingsStorage, 'deviceName'),
		300,
	);

	const handleDeviceNameChange = useCallback(
		(deviceName: string) => {
			setDeviceName(deviceName);
			saveDeviceName(deviceName);
		},
		[saveDeviceName],
	);

	const content = (() => {
		switch (settings.status) {
			case StorageHookState.Loaded: {
				return (
					<Localized id="device-name" attrs={{ label: true }}>
						<Input
							name="deviceName"
							labelPlacement="inside"
							fullWidth
							value={deviceName}
							onValueChange={handleDeviceNameChange}
						/>
					</Localized>
				);
			}

			case StorageHookState.Loading:
				return <Localized id="loading" />;

			case StorageHookState.Error:
				return <ErrorCode data={settings.error} />;
		}
	})();

	return (
		<CardSection
			bodyClassName="flex w-full min-w-60 flex-col gap-4"
			title={<Localized id="sync-storage" />}
		>
			{content}
		</CardSection>
	);
};
