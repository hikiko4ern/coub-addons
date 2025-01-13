import { Localized, useLocalization } from '@fluent/react';
import CloudArrowDownIcon from '@heroicons/react/24/outline/CloudArrowDownIcon';
import CloudArrowUpIcon from '@heroicons/react/24/outline/CloudArrowUpIcon';
import { Button, ButtonGroup } from '@nextui-org/button';
import cx from 'clsx';
import type { FunctionComponent } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';
import { toast } from 'react-toastify';
import { storage as wxtStorage } from 'wxt/storage';

import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';
import { type StorageToBackup, migrateStorages } from '@/storage/backup';
import { type AnyStorageBase, ShardedStorage, type StorageShard } from '@/storage/base';
import { TranslatableError } from '@/storage/errors';
import { getStorageByteSize } from '@/storage/helpers/getStorageByteSize';

// @ts-expect-error
window.wxtStorage = storage;

interface Props {
	className?: string;
	storage: AnyStorageBase;
	storageClass: StorageToBackup;
}

export const PerStorageSync: FunctionComponent<Props> = ({ className, storage, storageClass }) => {
	const { l10n } = useLocalization();
	const state = useStorageState({ storage });

	// TODO: move to a modal
	const storageSize = useMemo((): number | string => {
		if (state.status !== StorageHookState.Loaded) {
			return 0;
		}

		// @ts-expect-error
		const raw = storage.toRawValue(state.data);

		const shards: StorageShard<never>[] = [{ key: `${storage.key}$`, value: { v: 1 } }];

		if (storage instanceof ShardedStorage) {
			shards.unshift(
				...storage
					.shardRawValue(`${storage.key}:`, raw)
					.map((kv): typeof kv => ({ ...kv, key: `${storage.key}:${kv.key}` })),
			);
		} else {
			shards.unshift({ key: storage.key, value: raw });
		}

		let sum = 0;

		const sizes = shards.map(kv => {
			const size = kv.key.length + getStorageByteSize(kv.value);
			sum += size;
			const prefix =
				kv.key === storage.key
					? '.'
					: kv.key.endsWith('$')
						? 'meta'
						: kv.key.slice(storage.key.length + 1);
			return `(${prefix}) ${size}`;
		});
		sizes.push(`(total) ${sum}`);

		return sizes.join(' / ');
	}, [state]);

	const exportToCloud = useCallback(async () => {
		try {
			const items = await storage.getSyncItems();
			await wxtStorage.setItems(items);
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

	const importFromCloud = useCallback(async () => {
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
				<Button title={'export to cloud storage'} onPress={exportToCloud}>
					<CloudArrowUpIcon className="w-6" />
				</Button>

				<Button title={'import from cloud storage'} onPress={importFromCloud}>
					<CloudArrowDownIcon className="w-6" />
				</Button>

				<Button
					title={'import from cloud storage and merge with current settings'}
					onPress={() => alert('import with merge')}
				>
					{/* TODO: find a new icon pack with required icon (?) */}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="w-6"
						viewBox="0 0 24 24"
						role="img"
						aria-hidden="true"
					>
						<path
							fill="currentColor"
							d="M14.82 21h-9.32c-3.037 0-5.5-2.463-5.5-5.5 0-2.702 1.951-4.945 4.521-5.408.212-3.951 3.473-7.092 7.479-7.092 3.975 0 7.212 3.093 7.47 7.001-.667.003-1.309.106-1.914.296-.315-3.176-2.55-5.297-5.556-5.297-3.359 0-5.734 2.562-5.567 6.78-1.954-.113-4.433.923-4.433 3.72 0 1.93 1.57 3.5 3.5 3.5h8.001c.313.749.765 1.424 1.319 2zm9.18-4.5c0 2.485-2.017 4.5-4.5 4.5s-4.5-2.015-4.5-4.5 2.017-4.5 4.5-4.5 4.5 2.015 4.5 4.5zm-2-.5h-2v-2h-1v2h-2v1h2v2h1v-2h2v-1z"
						/>
					</svg>
				</Button>
			</ButtonGroup>

			<div className="shrink-0">Size: {storageSize}</div>
		</div>
	);
};
