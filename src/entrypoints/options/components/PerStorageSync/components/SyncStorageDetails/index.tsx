import { Localized, useLocalization } from '@fluent/react';
import { Button } from '@nextui-org/button';
import { ModalBody, ModalFooter } from '@nextui-org/modal';
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
import { type ComponentChildren, type FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { byteSize } from '@/helpers/byteSize';
import { CardSection } from '@/options/components/CardSection';
import { ErrorCode } from '@/options/components/ErrorCode';
import { logger } from '@/options/constants';
import {
	StorageHookState,
	type StorageState,
	useStorageState,
} from '@/options/hooks/useStorageState';
import type { AnyStorageBase } from '@/storage/base';

import styles from './styles.module.scss';

interface Props {
	storage: AnyStorageBase;
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
		key: 'byteSize',
		titleKey: 'size-in-bytes',
		align: 'end',
		width: 1,
	},
] as const satisfies Column[];

type ColumnKey = (typeof columns)[number]['key'];

const KEY_RE = /^(?<key>[^#]+)(?:#(?<index>\d+))?$/;

export const SyncStorageDetails: FunctionComponent<Props> = ({ storage }) => {
	const { l10n } = useLocalization();
	const state = useStorageState({ storage });
	const [shardsDetails, setShardsDetails] = useState<StorageState<ShardDetails[]>>(() => ({
		status: StorageHookState.Loading,
	}));

	useEffect(() => {
		if (state.status !== StorageHookState.Loaded) {
			setShardsDetails(state);
			return;
		}

		(async () => {
			const [shards] = await storage.getSyncItems();

			const details: Record<string, ShardDetails> = {};

			for (const shard of shards) {
				const storageKey = shard.key.slice('sync:'.length);
				let key: string, index: number | undefined;

				if (storageKey === storage.key) {
					key = '.';
				} else if (storageKey.endsWith('$')) {
					key = 'meta';
				} else {
					const keyMatch = storageKey.slice(storage.key.length + 1).match(KEY_RE);

					if (!keyMatch) {
						logger.warn('unmatched shard key', storageKey);
						continue;
					}

					let indexStr: string | undefined;

					({ key, index: indexStr } = keyMatch.groups as { key: string; index?: string });

					index = indexStr ? Number.parseInt(indexStr, 10) : undefined;
				}

				const size = byteSize(JSON.stringify(shard.value));
				const keyDetails = (details[key] ||= { key, details: [], totalByteSize: 0 });

				keyDetails.totalByteSize += size;
				keyDetails.details.push({
					key: index || 0,
					index,
					byteSize: size,
				});
			}

			const detailsValues = Object.values(details);

			for (const v of detailsValues) {
				if (v.details.length > 1) {
					v.details.push({
						key: TOTAL_KEY,
						index: TOTAL_KEY,
						byteSize: v.totalByteSize,
					});
				}
			}

			setShardsDetails({
				status: StorageHookState.Loaded,
				data: detailsValues,
			});
		})();
	}, [state]);

	const copyAsJson = useCallback(async () => {
		if (shardsDetails.status !== StorageHookState.Loaded) {
			return;
		}

		try {
			await navigator.clipboard.writeText(
				JSON.stringify(
					shardsDetails.data.reduce<Record<string, unknown>>((obj, { key, details }) => {
						obj[key] = details.map(({ key, index, ...rest }) => ({
							...rest,
							index: index ?? null,
						}));
						return obj;
					}, {}),
				),
			);
		} catch (err) {
			logger.error('failed to copy details as JSON:', err);
		}
	}, [shardsDetails]);

	let content: ComponentChildren, footer: ComponentChildren;

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
								) : (
									detail.index
								)}
							</TableCell>
						);
					}

					case 'byteSize':
						return <TableCell className="text-right font-mono">{detail.byteSize}</TableCell>;
				}
			};

			content = (
				<div
					className={cx(
						'grid gap-4',
						shardsDetails.data.length > 4 ? 'grid-cols-3' : 'grid-cols-2',
					)}
				>
					{shardsDetails.data.map(({ key, details }) => (
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

			footer = <Button onPress={copyAsJson}>JSON</Button>;
			break;
		}
	}

	return (
		<>
			<ModalBody>{content}</ModalBody>
			{footer && <ModalFooter>{footer}</ModalFooter>}
		</>
	);
};
