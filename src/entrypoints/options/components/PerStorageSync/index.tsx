import { Localized, useLocalization } from '@fluent/react';
import ArrowDownCircle from '@heroicons/react/24/outline/ArrowDownCircleIcon';
import CloudArrowDownIcon from '@heroicons/react/24/outline/CloudArrowDownIcon';
import CloudArrowUpIcon from '@heroicons/react/24/outline/CloudArrowUpIcon';
import InformationCircleIcon from '@heroicons/react/24/outline/InformationCircleIcon';
import { Button, ButtonGroup } from '@nextui-org/button';
import { Modal, ModalContent, useDisclosure } from '@nextui-org/modal';
import cx from 'clsx';
import type { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { toast } from 'react-toastify';
import { storage as wxtStorage } from 'wxt/storage';

import { mapFilter } from '@/helpers/mapFilter';
import { logger } from '@/options/constants';
import { downloadBackup } from '@/options/helpers/downloadBackup';
import { useIsDevMode } from '@/options/hooks/useIsDevMode';
import { useLocalizationContext } from '@/options/hooks/useLocalizationContext';
import { StorageHookState } from '@/options/hooks/useStorageState';
import { useSyncDeviceName } from '@/options/hooks/useSyncDeviceName';
import { type StorageToBackup, restoreBackup } from '@/storage/backup';
import type { AnySyncableStorage, StorageShard } from '@/storage/base';
import { TranslatableError } from '@/storage/errors';

import { SyncStorageDetails } from './components/SyncStorageDetails';
import { useLastSynced } from './hooks/useLastSynced';

interface Props {
	className?: string;
	storage: AnySyncableStorage;
}

export const PerStorageSync: FunctionComponent<Props> = ({ className, storage }) => {
	const { locale } = useLocalizationContext();
	const { l10n } = useLocalization();
	const isDevMode = useIsDevMode();
	const deviceName = useSyncDeviceName();
	const lastSynced = useLastSynced(storage.metaKey);
	const {
		isOpen: areDetailsOpen,
		onOpenChange: onDetailsOpenChange,
		onOpen: openDetails,
	} = useDisclosure();

	const isDeviceNameLoaded = deviceName.status === StorageHookState.Loaded;
	const lastSyncedData = lastSynced.status === StorageHookState.Loaded && lastSynced.data;

	const exportToSync = useCallback(async () => {
		if (!isDeviceNameLoaded) {
			return;
		}

		try {
			const [shards, removeKeys] = await storage.getSyncItems({
				lastSynced: {
					atUtc: Date.now(),
					deviceName: deviceName.data,
				},
			});
			logger.debug('got sync items', { shards, removeKeys });

			const newShardsKeys = new Set(shards.map(shard => shard.key));

			const extraSyncKeysToRemove = mapFilter(
				(await storage.getShardsFromSync(true))[0],
				shard => `sync:${shard.key}` as const,
				key => !newShardsKeys.has(key),
			);

			const allKeysToRemove = [...new Set([...removeKeys, ...extraSyncKeysToRemove])];

			const shardsWithPendingRemoval: StorageShard<'sync'>[] = [
				...shards,
				...allKeysToRemove.map(
					(key): StorageShard<'sync'> => ({
						key,
						value: undefined,
					}),
				),
			];

			logger.debug('exporting sync', {
				shardsWithPendingRemoval,
				allKeysToRemove,
			});

			// updates the storage in two steps:
			// 1. first, it writes new data and changes the values to be deleted to `null`
			// 2. then it deletes the extra `null` keys
			//
			// this way:
			// - if the first step fails, in theory, no data will change,
			//   and the old export will remain intact
			// - if the second step fails, extra keys with `null` will remain in the storage,
			//   but they will not affect anything, as they will be ignored during import
			await wxtStorage.setItems(shardsWithPendingRemoval).then(() => {
				toast.success(<Localized id="sync-backup-exported" />);

				if (allKeysToRemove.length > 0) {
					logger.debug('sync exported successfully, removing extra keys', allKeysToRemove);

					wxtStorage.removeItems(allKeysToRemove).catch(err => {
						logger.error('failed to remove extra keys:', err);
					});
				}
			});
		} catch (err) {
			const translatedError = err instanceof TranslatableError ? err.translate(l10n) : String(err);

			toast.error(
				typeof translatedError === 'string' ? (
					<Localized
						id="sync-backup-export-error"
						elems={{ br: <br /> }}
						vars={{ error: translatedError }}
					>
						<span />
					</Localized>
				) : (
					translatedError
				),
				{ autoClose: false },
			);
		}
	}, [storage, deviceName, isDeviceNameLoaded]);

	const importFromSync = useCallback(
		async (isMerge: boolean) => {
			try {
				await restoreBackup({
					storages: [storage.constructor as StorageToBackup],
					data: await storage.restoreFromSync(),
					isMerge,
				});

				try {
					await storage.reinitialize();
					toast.success(<Localized id="backup-imported-successfully" />);
				} catch {
					toast.warn(<Localized id="backup-imported-successfully-but-reinitialization-failed" />, {
						autoClose: 10000,
						onClose: () => browser.runtime.reload(),
					});
				}
			} catch (err) {
				logger.error('failed to import backup:', err);

				const translatedError =
					err instanceof TranslatableError ? err.translate(l10n) : String(err);

				toast.error(
					typeof translatedError === 'string' ? (
						<Localized
							id="backup-restoration-error"
							elems={{ br: <br />, pre: <span className="whitespace-pre-line" /> }}
							vars={{ error: translatedError }}
						>
							<span />
						</Localized>
					) : (
						translatedError
					),
					{ autoClose: false },
				);
			}
		},
		[l10n, storage],
	);

	const importWithOverwrite = useCallback(() => importFromSync(false), [importFromSync]);
	const importWithMerge = useCallback(() => importFromSync(true), [importFromSync]);

	const downloadSyncData = useCallback(async () => {
		if (!lastSyncedData) {
			return;
		}

		try {
			const backup = await storage.restoreFromSync();
			downloadBackup(`sync-${storage.key}`, lastSyncedData.at, JSON.stringify(backup));
		} catch (err) {
			toast.error(
				<Localized
					id="sync-backup-download-error"
					elems={{ br: <br /> }}
					vars={{ error: String(err) }}
				>
					<span />
				</Localized>,
			);
		}
	}, [storage, lastSyncedData]);

	return (
		<div className={cx('flex shrink-0 items-center gap-4', className)}>
			<ButtonGroup className="relative shrink-0">
				<Localized id="sync-backup-export" attrs={{ title: true }}>
					<Button
						isLoading={deviceName.status === StorageHookState.Loading}
						isDisabled={!isDeviceNameLoaded}
						onPress={exportToSync}
					>
						<CloudArrowUpIcon className="w-6" />
					</Button>
				</Localized>

				<Localized id="sync-backup-import" attrs={{ title: true }}>
					<Button isDisabled={!lastSyncedData} onPress={importWithOverwrite}>
						<CloudArrowDownIcon className="w-6" />
					</Button>
				</Localized>

				<Localized id="sync-backup-import-merge" attrs={{ title: true }}>
					<Button isDisabled={!lastSyncedData} onPress={importWithMerge}>
						{/* `Cloud` with plus sign from `PlusCircle` */}
						<svg
							className="w-6"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M2.237 15a4.5 4.5 0 0 0 4.5 4.5h11.25a3.75 3.75 0 0 0 1.332-7.256 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.237 15zm9.757-5.252v6m3-3h-6"
							/>
						</svg>
					</Button>
				</Localized>

				{isDevMode && (
					<>
						<Localized id="download-sync-backup" attrs={{ title: true }}>
							<Button isDisabled={!lastSyncedData} onPress={downloadSyncData}>
								<ArrowDownCircle className="w-6" />
							</Button>
						</Localized>

						<Localized id="sync-backup-storage-open-details" attrs={{ title: true }}>
							<Button onPress={openDetails}>
								<InformationCircleIcon className="w-6" />
							</Button>
						</Localized>
					</>
				)}
			</ButtonGroup>

			{(lastSyncedData || lastSynced.status === StorageHookState.Loading) && (
				<Localized id="last-sync" attrs={{ title: true }}>
					<div className="min-w-48 text-sm text-zinc-500 dark:text-zinc-400">
						{lastSyncedData && (
							<>
								<p>{lastSyncedData.deviceName}</p>
								<p>
									{lastSyncedData.at.toLocaleString(locale, {
										dateStyle: 'short',
										timeStyle: 'long',
									})}
								</p>
							</>
						)}
					</div>
				</Localized>
			)}

			{(isDevMode || areDetailsOpen) && (
				<Modal
					className="max-w-7xl"
					size="5xl"
					isOpen={areDetailsOpen}
					onOpenChange={onDetailsOpenChange}
				>
					<ModalContent>
						<SyncStorageDetails storage={storage} />
					</ModalContent>
				</Modal>
			)}
		</div>
	);
};
