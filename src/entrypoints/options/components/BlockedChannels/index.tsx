import { Localized } from '@fluent/react';
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon';
import { Input } from '@nextui-org/input';
import { useSignal } from '@preact/signals';
import type { FunctionComponent, VNode } from 'preact';
import { useCallback } from 'preact/hooks';
import { useDebouncedCallback } from 'use-debounce';

import { useWatchingRef } from '@/hooks/useWatchingRef';
import { ErrorCode } from '@/options/components/ErrorCode';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';
import { BlockedChannelsTable } from './components/BlockedChannelsTable';
import { ClearBlockedChannels } from './components/ClearBlockedChannels';
import { useSearch } from './hooks/useSearch';

export const BlockedChannels: FunctionComponent = () => {
	const { blockedChannelsStorage } = useLazyStorages();
	const {
		searchResult,
		initializeIndex: initialize,
		updateIndex: update,
		search,
		clearSearch,
	} = useSearch();
	const blockedChannels = useStorageState({
		storage: blockedChannelsStorage,
		onInit: initialize,
		onUpdate: update,
	});
	const query = useSignal('');

	const clearBlocklist = useCallback(() => blockedChannelsStorage.clear(), []);

	const removeFromBlocklist = useCallback(
		(id: number) => blockedChannelsStorage.setIsBlocked(id, false),
		[],
	);

	const blockedChannelsDataRef = useWatchingRef(
		blockedChannels.status === StorageHookState.Loaded ? blockedChannels.data : undefined,
	);
	const debouncedSearch = useDebouncedCallback(search, 20);

	const handleSearchInput = useCallback(
		(newQuery: string) => {
			query.value = newQuery;
			// TODO: delay query until initialized?
			blockedChannelsDataRef.current && debouncedSearch(blockedChannelsDataRef.current, newQuery);
		},
		[blockedChannelsDataRef, debouncedSearch],
	);

	const handleSearchClear = useCallback(() => {
		debouncedSearch.cancel();
		query.value = '';
		clearSearch();
	}, [clearSearch, debouncedSearch]);

	let content: string | VNode;

	switch (blockedChannels.status) {
		case StorageHookState.Loaded: {
			content = (
				<BlockedChannelsTable
					data={searchResult.value || blockedChannels.data}
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
		<div className="flex w-full flex-col items-start gap-4">
			<div className="flex w-full justify-between gap-4">
				<Localized id="blocked-channels-search" attrs={{ placeholder: true }}>
					<Input
						classNames={{
							mainWrapper: 'min-w-[min(theme(spacing.96),100%)]',
						}}
						name="search"
						type="search"
						isClearable
						value={query.value}
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
