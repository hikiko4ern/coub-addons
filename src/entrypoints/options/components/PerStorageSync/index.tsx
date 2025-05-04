import { Localized, useLocalization } from '@fluent/react';
import CloudArrowDownIcon from '@heroicons/react/24/outline/CloudArrowDownIcon';
import CloudArrowUpIcon from '@heroicons/react/24/outline/CloudArrowUpIcon';
import InformationCircleIcon from '@heroicons/react/24/outline/InformationCircleIcon';
import { Button, ButtonGroup } from '@nextui-org/button';
import { Modal, ModalContent, ModalHeader, useDisclosure } from '@nextui-org/modal';
import cx from 'clsx';
import type { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { toast } from 'react-toastify';
import { storage as wxtStorage } from 'wxt/storage';

import { logger } from '@/options/constants';
import { type StorageToBackup, migrateStorages } from '@/storage/backup';
import type { AnyStorageBase } from '@/storage/base';
import { TranslatableError } from '@/storage/errors';

import { SyncStorageDetails } from './components/SyncStorageDetails';

// @ts-expect-error
window.wxtStorage = storage;

interface Props {
	className?: string;
	storage: AnyStorageBase;
	storageClass: StorageToBackup;
}

export const PerStorageSync: FunctionComponent<Props> = ({ className, storage, storageClass }) => {
	const { l10n } = useLocalization();
	const {
		isOpen: areDetailsOpen,
		onOpenChange: onDetailsOpenChange,
		onOpen: openDetails,
	} = useDisclosure();

	const exportToSync = useCallback(async () => {
		try {
			const [shards, removeKeys] = await storage.getSyncItems();
			logger.debug('exporting', { shards, removeKeys });
			await Promise.all([wxtStorage.setItems(shards), wxtStorage.removeItems(removeKeys)]);
			toast.success(<Localized id="sync-backup-exported" />);
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

	const importFromSync = useCallback(async () => {
		try {
			const currentState = await storage.getItems();
			await storage.restoreFromSync();
			await migrateStorages([storageClass], () => wxtStorage.setItems(currentState));

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
			const translatedError = err instanceof TranslatableError ? err.translate(l10n) : String(err);

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
	}, [storage]);

	return (
		<div className={cx('flex shrink-0 items-center gap-4', className)}>
			<ButtonGroup className="relative shrink-0">
				<Button title={l10n.getString('sync-backup-export')} onPress={exportToSync}>
					<CloudArrowUpIcon className="w-6" />
				</Button>

				<Button title={l10n.getString('sync-backup-import')} onPress={importFromSync}>
					<CloudArrowDownIcon className="w-6" />
				</Button>

				<Button
					title={l10n.getString('sync-backup-import-merge')}
					onPress={() => alert('import with merge')}
				>
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

				<Button title={l10n.getString('sync-backup-storage-open-details')} onPress={openDetails}>
					<InformationCircleIcon className="w-6" />
				</Button>
			</ButtonGroup>

			<Modal size="2xl" isOpen={areDetailsOpen} onOpenChange={onDetailsOpenChange}>
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1">
						<Localized id="sync-backup-storage-details-title" vars={{ storage: storage.key }} />
					</ModalHeader>

					<SyncStorageDetails storage={storage} />
				</ModalContent>
			</Modal>
		</div>
	);
};
