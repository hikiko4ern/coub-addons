import { Localized } from '@fluent/react';
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon';
import { Input } from '@nextui-org/input';
import type { FunctionComponent, VNode } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { useDebouncedCallback } from 'use-debounce';

import { ErrorCode } from '@/options/components/ErrorCode';
import { logger } from '@/options/constants';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';
import { BlockedChannelsStorage } from '@/storage/blockedChannels';

import { BlockedChannelsTable } from './components/BlockedChannelsTable';
import { ClearBlockedChannels } from './components/ClearBlockedChannels';
import { useSearch } from './hooks/useSearch';

let blockedChannelsStorage: BlockedChannelsStorage;

export const BlockedChannels: FunctionComponent = () => {
	const { searchResult, initialize, update, search, clearSearch } = useSearch();
	const blockedChannels = useStorageState({
		storage: (blockedChannelsStorage ||= new BlockedChannelsStorage('options', logger)),
		onInit: initialize,
		onUpdate: update,
	});
	const [query, setQuery] = useState('');

	const clearBlocklist = useCallback(() => blockedChannelsStorage.clear(), []);

	const removeFromBlocklist = useCallback(
		(id: number) => blockedChannelsStorage.setIsBlocked(id, false),
		[],
	);

	const debouncedSearch = useDebouncedCallback(search, 200);

	const handleSearchInput = useCallback(
		(query: string) => {
			setQuery(query);
			debouncedSearch(query);
		},
		[debouncedSearch],
	);

	const handleSearchClear = useCallback(() => {
		debouncedSearch.cancel();
		setQuery('');
		clearSearch();
	}, [clearSearch, debouncedSearch]);

	let content: string | VNode;

	switch (blockedChannels.status) {
		case StorageHookState.Loaded: {
			content = (
				<BlockedChannelsTable
					data={searchResult || blockedChannels.data}
					globalTotal={blockedChannels.data.size}
					isSearchApplied={!!searchResult}
					onRemove={removeFromBlocklist}
				/>
			);
			break;
		}

		case StorageHookState.Loading: {
			content = <Localized id="loading" />;
			break;
		}

		case StorageHookState.Error: {
			content = <ErrorCode data={blockedChannels.error} />;
			break;
		}
	}

	return (
		<div className="w-full flex flex-col items-start gap-4">
			<div className="w-full flex justify-between gap-4">
				<Localized id="blocked-channels-search" attrs={{ placeholder: true }}>
					<Input
						classNames={{
							mainWrapper: 'min-w-[min(theme(spacing.96),100%)]',
						}}
						name="search"
						type="search"
						isClearable
						value={query}
						labelPlacement="outside-left"
						startContent={<MagnifyingGlassIcon className="h-4" />}
						onValueChange={handleSearchInput}
						onClear={handleSearchClear}
					/>
				</Localized>

				<ClearBlockedChannels className="flex-shrink-0" clear={clearBlocklist} />
			</div>

			{content}
		</div>
	);
};
