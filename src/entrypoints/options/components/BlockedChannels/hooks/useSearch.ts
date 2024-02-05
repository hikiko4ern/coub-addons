import { useSignal } from '@preact/signals';
import { default as FlexSearch } from 'flexsearch';
import { useCallback, useRef } from 'preact/hooks';

import type { BlockedChannelData, ReadonlyBlockedChannels } from '@/storage/blockedChannels';

const stringify = (channel: Readonly<BlockedChannelData>) =>
	channel.permalink ? `${channel.title} ${channel.permalink}` : channel.title;

export const useSearch = () => {
	const instance = useRef<FlexSearch.Index>();
	const searchResult = useSignal<BlockedChannelData[] | undefined>(undefined);

	const initializeIndex = useCallback((state: ReadonlyBlockedChannels) => {
		const index = (instance.current = new FlexSearch.Index({
			tokenize: 'full',
			encode: str =>
				str
					.normalize('NFKC')
					.toLowerCase()
					.split(/[\p{Z}\p{S}\p{P}\p{C}]+/u),
		}));

		for (const channel of state.values()) {
			index.add(channel.id, stringify(channel));
		}
	}, []);

	const updateIndex = useCallback((state: ReadonlyBlockedChannels, diff: ReadonlySet<number>) => {
		const index = instance.current;

		if (!index) {
			throw new Error('Index was not initialized');
		}

		for (const id of diff) {
			const item = state.get(id);

			if (item) {
				index.add(item.id, stringify(item));
			} else {
				index.remove(id);
			}
		}
	}, []);

	const search = useCallback((state: ReadonlyBlockedChannels, query: string) => {
		const index = instance.current;

		if (!index) {
			throw new Error('Index was not initialized');
		}

		if (!query) {
			searchResult.value = undefined;
			return;
		}

		index.searchAsync(query, Number.POSITIVE_INFINITY).then(res => {
			searchResult.value = res.reduce<BlockedChannelData[]>((arr, id) => {
				const channel = state.get(id as number);
				channel && arr.push(channel);
				return arr;
			}, []);
		});
	}, []);

	const clearSearch = useCallback(() => (searchResult.value = undefined), []);

	return {
		searchResult,
		initializeIndex,
		updateIndex,
		search,
		clearSearch,
	};
};
