import { name } from '../../../../../../package.json';

import { Localized, useLocalization } from '@fluent/react';
import DocumentArrowDownIcon from '@heroicons/react/24/solid/DocumentArrowDownIcon';
import DocumentArrowUpIcon from '@heroicons/react/24/solid/DocumentArrowUpIcon';
import DocumentPlusIcon from '@heroicons/react/24/solid/DocumentPlusIcon';
import { Button, ButtonGroup } from '@nextui-org/button';
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	useDisclosure,
} from '@nextui-org/modal';
import { useSignal } from '@preact/signals';
import type { FunctionComponent, JSX } from 'preact';
import { useCallback, useRef } from 'preact/hooks';
import { toast } from 'react-toastify';

import { CardSection } from '@/options/components/CardSection';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import {
	type Backup,
	type ImportBackupData,
	TranslatableError,
	createBackup,
	restoreBackup,
} from '@/storage/backup';

const pad = (value: number) => value.toString().padStart(2, '0');

export const ImportExport: FunctionComponent = () => {
	const restoreRef = useRef<ImportBackupData>();
	const isLoading = useSignal(false);
	const isRestoring = useSignal(false);
	const { l10n } = useLocalization();
	const lazyStorages = useLazyStorages();
	const {
		isOpen: isImportConfirmationOpen,
		onOpenChange: onImportConfirmationChange,
		onOpen: openImportConfirmation,
		onClose: closeImportConfirmation,
	} = useDisclosure();

	const createAndDownloadBackup = useCallback(async () => {
		try {
			const backup = await createBackup(),
				a = document.createElement('a'),
				url = URL.createObjectURL(new Blob([backup])),
				date = new Date();

			a.href = url;
			a.target = '_blank';
			a.download = `${name}-backup_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
				date.getDate(),
			)}_${pad(date.getHours())}-${pad(date.getMinutes())}.json`;

			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			toast.error(
				<Localized id="backup-creation-error" elems={{ br: <br /> }} vars={{ error: String(err) }}>
					<span />
				</Localized>,
			);
		}
	}, []);

	const restore = useCallback(async () => {
		if (restoreRef.current) {
			isLoading.value = true;
			isRestoring.value = true;

			try {
				await restoreBackup(restoreRef.current);

				closeImportConfirmation();

				try {
					await Promise.all([
						lazyStorages.blockedChannelsStorage.reinitialize(),
						lazyStorages.blockedTagsStorage.reinitialize(),
						lazyStorages.blockedCoubTitlesStorage.reinitialize(),
						lazyStorages.blocklistStorage.reinitialize(),
						lazyStorages.playerSettingsStorage.reinitialize(),
						lazyStorages.statsStorage.reinitialize(),
						lazyStorages.settingsStorage.reinitialize(),
					]);
					toast.success(<Localized id="backup-imported-successfully" />);
				} catch {
					toast.warn(<Localized id="backup-imported-successfully-but-reinitialization-failed" />, {
						autoClose: 10000,
						onClose: () => browser.runtime.reload(),
					});
				}
			} catch (err) {
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
			} finally {
				isLoading.value = false;
				isRestoring.value = false;
			}
		}
	}, [l10n]);

	const handleChange = useCallback<JSX.GenericEventHandler<HTMLInputElement>>(async e => {
		const input = e.currentTarget;
		const file = input.files?.[0];

		if (file) {
			try {
				const text = await file.text();
				const data = JSON.parse(text) as Backup;

				input.value = '';
				restoreRef.current = {
					data,
					isMerge: input.dataset.merge === 'true',
				};

				return openImportConfirmation();
			} catch {}

			toast.error(<Localized id="file-content-is-not-a-valid-backup" />);
		}
	}, []);

	const renderImportBackupButton = (
		title: string,
		Icon: typeof DocumentArrowDownIcon,
		isMerge?: boolean,
	) => (
		<Button
			as="label"
			title={title}
			isLoading={isLoading.value && !isRestoring.value}
			isDisabled={isLoading.value}
		>
			<Icon className="w-6" />

			<input
				className="absolute h-0 w-0 opacity-0"
				type="file"
				accept="application/json"
				data-merge={isMerge}
				onChange={handleChange}
			/>
		</Button>
	);

	return (
		<CardSection bodyClassName="flex min-w-60 flex-col gap-4" title={<Localized id="backups" />}>
			<ButtonGroup className="relative">
				<Button
					color="primary"
					title={l10n.getString('export-backup')}
					isLoading={isLoading.value && !isRestoring.value}
					isDisabled={isLoading.value}
					onPress={createAndDownloadBackup}
				>
					<DocumentArrowUpIcon className="w-6" />
				</Button>

				{renderImportBackupButton(l10n.getString('import-backup'), DocumentArrowDownIcon)}

				{renderImportBackupButton(l10n.getString('import-merge-backup'), DocumentPlusIcon, true)}

				<Modal isOpen={isImportConfirmationOpen} onOpenChange={onImportConfirmationChange}>
					<ModalContent>
						{onClose => (
							<>
								<ModalHeader className="flex flex-col gap-1">
									<Localized id="import-backup-confirmation-header" />
								</ModalHeader>

								<ModalBody>
									<Localized
										id={
											restoreRef.current?.isMerge === true
												? 'import-merge-backup-confirmation-message'
												: 'import-backup-confirmation-message'
										}
									/>
								</ModalBody>

								<ModalFooter>
									<Button color="primary" onPress={restore}>
										<Localized id="confirm" />
									</Button>

									<Button
										isLoading={isLoading.value && isRestoring.value}
										isDisabled={isLoading.value}
										onPress={onClose}
									>
										<Localized id="cancel" />
									</Button>
								</ModalFooter>
							</>
						)}
					</ModalContent>
				</Modal>
			</ButtonGroup>
		</CardSection>
	);
};
