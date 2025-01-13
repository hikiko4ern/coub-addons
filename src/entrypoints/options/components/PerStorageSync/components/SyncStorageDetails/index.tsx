import { Localized, useLocalization } from '@fluent/react';
import { Button } from '@nextui-org/button';
import { ModalBody, ModalHeader } from '@nextui-org/modal';
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	type TableColumnProps,
	TableHeader,
	TableRow,
} from '@nextui-org/table';
import cx from 'clsx';
import type { ComponentChildren, FunctionComponent } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { toast } from 'react-toastify';

import { byteSize } from '@/helpers/byteSize';
import { CardSection } from '@/options/components/CardSection';
import { ErrorCode } from '@/options/components/ErrorCode';
import { logger } from '@/options/constants';
import { useLocalizationContext } from '@/options/hooks/useLocalizationContext';
import { useMergeStorageStates } from '@/options/hooks/useMergeStorageStates';
import {
	StorageHookState,
	type StorageState,
	useStorageState,
} from '@/options/hooks/useStorageState';
import { useSyncDeviceName } from '@/options/hooks/useSyncDeviceName';
import type { AnySyncableStorage, StorageShard } from '@/storage/base';
import type { ObjectEntries, ToReadonly } from '@/types/util';

import styles from './styles.module.scss';

interface Props {
	storage: AnySyncableStorage;
}

interface AllDetails {
	local: Details;
	sync: Details;
}

interface Details {
	shards: ShardDetails[];
	totalByteSize: number;
}

interface ShardDetails {
	key: string;
	details: ShardDetail[];
	totalByteSize: number;
}

const TOTAL_KEY = 'total';
type TOTAL_KEY = typeof TOTAL_KEY;

interface ShardDetail {
	key: number | TOTAL_KEY;
	index: number | TOTAL_KEY | undefined;
	byteSize: number;
	format: string | null;
}

interface Column extends Pick<TableColumnProps<unknown>, 'className' | 'align' | 'width'> {
	key: string;
	titleKey: string;
}

const columns = [
	{
		className: 'text-right',
		key: 'index',
		titleKey: 'index',
		align: 'end',
		width: 1,
	},
	{
		className: 'text-right',
		key: 'format',
		titleKey: 'format',
		align: 'end',
		width: 1,
	},
	{
		className: 'text-right',
		key: 'byteSize',
		titleKey: 'size-in-bytes',
		align: 'end',
		width: 1,
	},
] as const satisfies Column[];

type ColumnKey = (typeof columns)[number]['key'];

const KEY_RE = /^(?<key>[^#]+)(?:#(?<index>\d+))?$/;

const sortCollator = new Intl.Collator('en', { usage: 'sort' });

const getDataSample = (value: unknown): ShardDetail['format'] => {
	if (typeof value !== 'string') {
		return null;
	}

	const firstBytes = value.slice(0, 5);
	return firstBytes.split(':')[0] || firstBytes + '...';
};

const getDetails = (storageKey: string, shards: StorageShard[]): Details => {
	const details: Record<string, ShardDetails> = {};

	for (const shard of shards) {
		let key: string, index: number | undefined;

		if (typeof shard.key !== 'string' || shard.key === storageKey) {
			key = '.';
		} else if (shard.key.endsWith('$')) {
			key = 'meta';
		} else {
			const field = shard.key.startsWith(storageKey)
				? shard.key.slice(storageKey.length + 1)
				: shard.key;

			const fieldMatch = field.match(KEY_RE);

			if (!fieldMatch) {
				logger.warn('unmatched shard key', shard.key, field);
				continue;
			}

			let indexStr: string | undefined;

			({ key, index: indexStr } = fieldMatch.groups as { key: string; index?: string });

			index = indexStr ? Number.parseInt(indexStr, 10) : undefined;
		}

		const size = byteSize(JSON.stringify(shard.value));
		const keyDetails = (details[key] ||= { key, details: [], totalByteSize: 0 });

		keyDetails.totalByteSize += size;
		keyDetails.details.push({
			key: index || 0,
			index,
			byteSize: size,
			format: getDataSample(shard.value),
		});
	}

	const detailsValues = Object.values(details);

	for (const v of detailsValues) {
		v.details.sort(
			(a, b) =>
				(a.key as Exclude<typeof a.key, TOTAL_KEY>) - (b.key as Exclude<typeof b.key, TOTAL_KEY>),
		);

		// fill `total` for multiple keys
		if (v.details.length > 1) {
			v.details.push({
				key: TOTAL_KEY,
				index: TOTAL_KEY,
				byteSize: v.totalByteSize,
				format: null,
			});
		}
	}

	detailsValues.sort((a, b) =>
		a.key === 'meta' ? (b.key === 'meta' ? 0 : -1) : sortCollator.compare(a.key, b.key),
	);

	return {
		shards: detailsValues,
		totalByteSize: detailsValues.reduce((total, details) => total + details.totalByteSize, 0),
	};
};

export const SyncStorageDetails: FunctionComponent<Props> = ({ storage }) => {
	const { locale } = useLocalizationContext();
	const { l10n } = useLocalization();
	const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
	const byteNumberFormat = useMemo(
		() => new Intl.NumberFormat(locale, { style: 'unit', unit: 'byte', unitDisplay: 'narrow' }),
		[locale],
	);
	const deviceName = useSyncDeviceName();
	const state = useStorageState({ storage });
	const [shardsDetails, setShardsDetails] = useState<StorageState<AllDetails>>(() => ({
		status: StorageHookState.Loading,
	}));

	const states = useMergeStorageStates({
		deviceName,
		state,
	});

	useEffect(() => {
		if (states.status !== StorageHookState.Loaded) {
			setShardsDetails(states);
			return;
		}

		(async () => {
			const [[syncShards, { [storage.metaKey]: meta }], [localShards]] = await Promise.all([
				storage.getShardsFromSync(),
				storage.getSyncItems({
					lastSynced: {
						atUtc: Date.now(),
						deviceName: states.data.deviceName,
					},
				}),
			]);

			if (meta) {
				syncShards.unshift({
					key: 'meta',
					value: meta,
				});
			}

			const sync = getDetails(storage.key, syncShards);

			const local = getDetails(
				storage.key,
				localShards.map(
					(shard): StorageShard => ({
						...shard,
						key: shard.key.slice('sync:'.length),
					}),
				),
			);

			setShardsDetails({
				status: StorageHookState.Loaded,
				data: {
					local,
					sync,
				},
			});
		})();
	}, [states]);

	const copyAsJson = useCallback(
		async (key: keyof AllDetails) => {
			if (shardsDetails.status !== StorageHookState.Loaded) {
				return;
			}

			try {
				const { shards, totalByteSize } = shardsDetails.data[key];

				await navigator.clipboard.writeText(
					JSON.stringify({
						fields: shards.reduce<Record<string, unknown>>((obj, { key, details }) => {
							const totalIndex = details.findIndex(d => d.key === TOTAL_KEY);

							const [total, shards] =
								totalIndex === -1
									? [details[0].byteSize, details]
									: [details[totalIndex].byteSize, details.toSpliced(totalIndex, 1)];

							obj[key] = {
								shards: shards.map(({ key, index, ...rest }) => ({
									...rest,
									index: index ?? null,
								})),
								totalByteSize: total,
							};
							return obj;
						}, {}),
						totalByteSize,
					}),
				);
			} catch (err) {
				logger.error('failed to copy details as JSON:', err);
				toast.error(String(err));
			}
		},
		[shardsDetails],
	);

	let content: ComponentChildren;

	switch (shardsDetails.status) {
		case StorageHookState.Loading: {
			content = <Localized id="loading" />;
			break;
		}

		case StorageHookState.Error: {
			content = <ErrorCode data={shardsDetails.error} />;
			break;
		}

		case StorageHookState.Loaded: {
			const renderCell = (detail: ShardDetail, columnKey: ColumnKey) => {
				switch (columnKey) {
					case 'index': {
						const isTotal = detail.index === TOTAL_KEY;

						return (
							<TableCell
								className={cx('text-right text-zinc-500 dark:text-zinc-400', {
									'font-mono': !isTotal,
								})}
							>
								{isTotal ? (
									<span>
										<Localized id={TOTAL_KEY} />
									</span>
								) : typeof detail.index === 'number' ? (
									numberFormat.format(detail.index)
								) : (
									detail.index
								)}
							</TableCell>
						);
					}

					case 'format':
						return (
							<TableCell className="text-right font-mono text-zinc-500 dark:text-zinc-400">
								{detail.format}
							</TableCell>
						);

					case 'byteSize':
						return (
							<TableCell className="text-right font-mono">
								{numberFormat.format(detail.byteSize)}
							</TableCell>
						);
				}
			};

			const renderTable = (shards: ToReadonly<Details['shards']>) => (
				<div className={cx('grid gap-4', shards.length > 4 ? 'grid-cols-3' : 'grid-cols-2')}>
					{shards.map(({ key, details }) => (
						<CardSection key={key} bodyClassName="w-full" title={key}>
							<Table
								classNames={{ table: styles['sync-storage-details__table'] }}
								isCompact
								selectionMode="none"
								removeWrapper
								aria-label={l10n.getString('blocked-channels-list')}
							>
								<TableHeader columns={columns}>
									{column => (
										<TableColumn
											key={column.key}
											className={'className' in column ? column.className : undefined}
											align={'align' in column ? column.align : undefined}
											width={'width' in column ? column.width : undefined}
										>
											<Localized id={column.titleKey} />
										</TableColumn>
									)}
								</TableHeader>

								<TableBody items={details}>
									{item => (
										<TableRow
											key={item.key}
											className={
												item.key === TOTAL_KEY
													? '[&>*]:before:bg-default-100 [&>*]:before:opacity-100'
													: undefined
											}
										>
											{columnKey => renderCell(item, columnKey as ColumnKey)}
										</TableRow>
									)}
								</TableBody>
							</Table>
						</CardSection>
					))}
				</div>
			);

			content = (
				Object.entries(shardsDetails.data) as ObjectEntries<typeof shardsDetails.data>
			).map(([key, { shards, totalByteSize }]) => (
				<section key={key} className="flex flex-1 flex-col gap-4">
					<header>{key}</header>

					{renderTable(shards)}

					<footer className="mt-auto flex items-center justify-between">
						<div className="text-zinc-500 dark:text-zinc-400">
							<Localized id="total-def" vars={{ total: byteNumberFormat.format(totalByteSize) }} />
						</div>

						<Button onPress={() => copyAsJson(key)}>JSON</Button>
					</footer>
				</section>
			));

			break;
		}
	}

	return (
		<>
			<ModalHeader className="flex flex-col gap-1">
				<Localized id="sync-backup-storage-shards-title" vars={{ storage: storage.key }} />
			</ModalHeader>

			<ModalBody className="flex flex-row gap-0 [&>*+*]:ms-5 [&>*+*]:border-s [&>*+*]:border-s-zinc-300 [&>*+*]:ps-5 dark:[&>*+*]:border-s-zinc-700">
				{content}
			</ModalBody>
		</>
	);
};
