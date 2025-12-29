import { Localized, useLocalization } from '@fluent/react';
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
import { useIsDevMode } from '@/options/hooks/useIsDevMode';
import { type StorageToBackup, restoreBackup } from '@/storage/backup';
import { type AnyStorageBase, type StorageShard } from '@/storage/base';
import { TranslatableError } from '@/storage/errors';

import { SyncStorageDetails } from './components/SyncStorageDetails';

interface Props {
	className?: string;
	storage: AnyStorageBase;
}

export const PerStorageSync: FunctionComponent<Props> = ({ className, storage }) => {
	const { l10n } = useLocalization();
	const isDevMode = useIsDevMode();
	const {
		isOpen: areDetailsOpen,
		onOpenChange: onDetailsOpenChange,
		onOpen: openDetails,
	} = useDisclosure();

	const exportToSync = useCallback(async () => {
		try {
			const [shards, removeKeys] = await storage.getSyncItems();
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
	}, [storage]);

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

	return (
		<div className={cx('flex shrink-0 items-center gap-4', className)}>
			<ButtonGroup className="relative shrink-0">
				<Button title={l10n.getString('sync-backup-export')} onPress={exportToSync}>
					<CloudArrowUpIcon className="w-6" />
				</Button>

				<Button title={l10n.getString('sync-backup-import')} onPress={importWithOverwrite}>
					<CloudArrowDownIcon className="w-6" />
				</Button>

				<Button title={l10n.getString('sync-backup-import-merge')} onPress={importWithMerge}>
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

				{isDevMode && (
					<Button title={l10n.getString('sync-backup-storage-open-details')} onPress={openDetails}>
						<InformationCircleIcon className="w-6" />
					</Button>
				)}
			</ButtonGroup>

			{(isDevMode || areDetailsOpen) && (
				<Modal
					className="max-w-6xl"
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
