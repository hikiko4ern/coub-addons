import { Localized, useLocalization } from '@fluent/react';
import { Link } from '@nextui-org/link';
import { Pagination } from '@nextui-org/pagination';
import { Select, SelectItem } from '@nextui-org/select';
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	type TableColumnProps,
	TableHeader,
	TableRow,
} from '@nextui-org/table';
import type { Selection } from '@react-types/shared';
import type { FunctionComponent } from 'preact';
import { useCallback, useMemo, useState } from 'preact/hooks';

import type {
	BlockedChannelData,
	BlockedChannelsStorage,
	ReadonlyBlockedChannels,
} from '@/storage/blockedChannels';

import { Actions } from './components/Actions';
import styles from './styles.module.scss';

interface Props {
	storage: BlockedChannelsStorage;
	data: BlockedChannelData[] | ReadonlyBlockedChannels;
	globalTotal: number;
	isSearchApplied: boolean;
	onRemove: (id: number) => Promise<void>;
}

interface Column extends Pick<TableColumnProps<unknown>, 'className' | 'align' | 'width'> {
	key: string;
	titleKey: string;
}

const columns = [
	{
		key: 'title',
		titleKey: 'title',
	},
	{
		className: 'text-right',
		key: 'id',
		titleKey: 'ID',
		align: 'end',
		width: 1,
	},
	{
		className: 'text-center',
		key: 'actions',
		titleKey: 'actions',
		align: 'center',
		width: 1,
	},
] as const satisfies Column[];

const rowsPerPage = [10, 20, 50, 100] as const;
const defaultRowsPerPage: RowsPerPage = 20;

type ColumnKey = (typeof columns)[number]['key'];
type RowsPerPage = (typeof rowsPerPage)[number];

export const BlockedChannelsTable: FunctionComponent<Props> = ({
	storage,
	data,
	globalTotal,
	isSearchApplied,
	onRemove,
}) => {
	const { l10n } = useLocalization();
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState<RowsPerPage>(defaultRowsPerPage);
	const perPageSelectedKeys = useMemo(() => [perPage], [perPage]);

	const total = Array.isArray(data) ? data.length : data.size;
	const totalPages = Math.ceil(total / perPage);

	const dataAsArray = useMemo(
		() => (Array.isArray(data) ? data : Array.from(data.values())),
		[data],
	);

	const tableData = useMemo(() => {
		const start = (page - 1) * perPage;
		const end = page * perPage;
		return dataAsArray.slice(start, end);
	}, [dataAsArray, page, perPage]);

	const handleRowsPerPageChange = useCallback((keys: Selection) => {
		if (keys === 'all') {
			return;
		}

		const item = keys.values().next();

		if (item.done) {
			return;
		}

		setPerPage(item.value as RowsPerPage);
	}, []);

	const renderCell = (channel: BlockedChannelData, columnKey: ColumnKey) => {
		switch (columnKey) {
			case 'id':
				return <TableCell className="text-right text-zinc-300">{channel.id}</TableCell>;

			case 'title':
				return (
					<TableCell>
						{channel.permalink ? (
							<Link
								href={`${import.meta.env.VITE_COUB_ORIGIN}/${channel.permalink}`}
								size="sm"
								isExternal
							>
								{channel.title}
							</Link>
						) : (
							channel.title
						)}
					</TableCell>
				);

			case 'actions':
				return (
					<TableCell>
						<Actions storage={storage} id={channel.id} onRemove={onRemove} />
					</TableCell>
				);
		}
	};

	return (
		<>
			<div className="flex w-full items-center justify-between">
				<span className="text-default-400 text-small">
					<Localized id="blocked-channels-total" vars={{ total }} />
				</span>

				<Localized id="rows-per-page" attrs={{ label: true }}>
					<Select
						className="w-auto items-center"
						classNames={{
							mainWrapper: 'w-20',
						}}
						labelPlacement="outside-left"
						size="sm"
						fullWidth={false}
						selectedKeys={perPageSelectedKeys}
						scrollShadowProps={{ isEnabled: false }}
						onSelectionChange={handleRowsPerPageChange}
					>
						{rowsPerPage.map(value => (
							<SelectItem key={value} value={value}>
								{String(value)}
							</SelectItem>
						))}
					</Select>
				</Localized>
			</div>

			<Table
				classNames={{ table: styles['blocked-channels-table'] }}
				isCompact
				isStriped
				aria-label={l10n.getString('blocked-channels-list')}
				bottomContent={
					globalTotal > 0 && (
						<div className="flex w-full justify-center">
							<Pagination
								isCompact
								showControls
								showShadow
								color="secondary"
								page={page}
								total={totalPages}
								onChange={setPage}
							/>
						</div>
					)
				}
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

				<TableBody
					items={tableData}
					emptyContent={
						<Localized
							id={isSearchApplied ? 'no-blocked-channels-by-search' : 'no-blocked-channels'}
						/>
					}
				>
					{item => (
						<TableRow key={item.id}>
							{columnKey => renderCell(item, columnKey as ColumnKey)}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</>
	);
};
