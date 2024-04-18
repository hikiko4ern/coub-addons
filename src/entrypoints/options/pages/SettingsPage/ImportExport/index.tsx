import { name } from '../../../../../../package.json';

import { Localized } from '@fluent/react';
import { Button } from '@nextui-org/button';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
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

import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import {
	type Backup,
	StorageMigrationsFailed,
	createBackup,
	restoreBackup,
} from '@/storage/backup';
import { FluentList, t } from '@/translation/js';

const pad = (value: number) => value.toString().padStart(2, '0');

export const ImportExport: FunctionComponent = () => {
	const inputRef = useRef<HTMLInputElement>(null);
	const restoreRef = useRef<Backup>();
	const isLoading = useSignal(false);
	const isRestoring = useSignal(false);
	const lazyStorages = useLazyStorages();
	const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

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
				<>
					<Localized
						id="backup-creation-error"
						elems={{ br: <br /> }}
						vars={{ error: String(err) }}
					>
						<span />
					</Localized>
				</>,
			);
		}
	}, []);

	const restore = useCallback(async () => {
		if (restoreRef.current) {
			isLoading.value = true;
			isRestoring.value = true;

			try {
				await restoreBackup(restoreRef.current);

				onClose();

				try {
					await Promise.all([
						lazyStorages.blockedChannelsStorage.reinitialize(),
						lazyStorages.blockedTagsStorage.reinitialize(),
						lazyStorages.blockedCoubTitlesStorage.reinitialize(),
						lazyStorages.blocklistStorage.reinitialize(),
						lazyStorages.statsStorage.reinitialize(),
					]);
					toast.success(<Localized id="backup-imported-successfully" />);
				} catch {
					toast.warn(<Localized id="backup-imported-successfully-but-reinitialization-failed" />, {
						autoClose: 10000,
						onClose: () => browser.runtime.reload(),
					});
				}
			} catch (err) {
				toast.error(
					<>
						<Localized
							id="backup-restoration-error"
							elems={{ br: <br /> }}
							vars={{
								error:
									err instanceof StorageMigrationsFailed
										? t('backup-migrations-failed', {
												args: {
													keys: new FluentList(err.keys, { type: 'conjunction' }),
													error: err.cause.errors.join(', '),
												},
											})
										: String(err),
							}}
						>
							<span />
						</Localized>
					</>,
				);
			} finally {
				isLoading.value = false;
				isRestoring.value = false;
			}
		}
	}, []);

	const handleChange = useCallback<JSX.GenericEventHandler<HTMLInputElement>>(async e => {
		const input = e.currentTarget;
		const file = input.files?.[0];

		if (file) {
			try {
				const text = await file.text();
				const data = JSON.parse(text);

				input.value = '';
				restoreRef.current = data;

				return onOpen();
			} catch {}

			toast.error(<Localized id="file-content-is-not-a-valid-backup" />);
		}
	}, []);

	return (
		<Card className="items-start" as="section" fullWidth={false}>
			<CardHeader>
				<Localized id="backups" />
			</CardHeader>

			<CardBody className="flex w-auto min-w-60 flex-col gap-4">
				<Button
					color="primary"
					isLoading={isLoading.value && !isRestoring.value}
					isDisabled={isLoading.value}
					onPress={createAndDownloadBackup}
				>
					<Localized id="export-backup" />
				</Button>

				<Button
					className="relative"
					as="label"
					isLoading={isLoading.value && !isRestoring.value}
					isDisabled={isLoading.value}
				>
					<Localized id="import-backup" />

					<input
						ref={inputRef}
						className="absolute h-0 w-0 opacity-0"
						type="file"
						accept="application/json"
						onChange={handleChange}
					/>

					<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
						<ModalContent>
							{onClose => (
								<>
									<ModalHeader className="flex flex-col gap-1">
										<Localized id="import-backup-confirmation-header" />
									</ModalHeader>

									<ModalBody>
										<Localized id="import-backup-confirmation-message" />
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
				</Button>
			</CardBody>
		</Card>
	);
};
