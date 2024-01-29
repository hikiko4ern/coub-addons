import Fuse from 'fuse.js';
import { ifilter } from 'itertools';
import { useCallback, useRef, useState } from 'preact/hooks';

import type { BlockedChannelData, ReadonlyBlockedChannels } from '@/storage/blockedChannels';

export const useSearch = () => {
	const instance = useRef<Fuse<BlockedChannelData>>();
	const [searchResult, setSearchResult] = useState<BlockedChannelData[]>();

	const initialize = useCallback((state: ReadonlyBlockedChannels) => {
		instance.current = new Fuse(Array.from(state.values()), {
			keys: [
				'permalink',
				{
					name: 'title',
					getFn: data => data.title.normalize('NFKC'),
				},
			],
		});
	}, []);

	const update = useCallback((state: ReadonlyBlockedChannels, diff: ReadonlySet<number>) => {
		if (!instance.current) {
			throw new Error('Fuse was not initialized');
		}

		const removed = new Set(
			ifilter(diff, id => {
				const item = state.get(id);
				return item
					? // biome-ignore lint/style/noNonNullAssertion: instance cannot be de-initialized
					  (instance.current!.add(item), false)
					: true;
			}),
		);
		instance.current.remove(doc => removed.has(doc.id));
	}, []);

	const search = useCallback((query: string) => {
		if (!instance.current) {
			throw new Error('Fuse was not initialized');
		}

		if (!query) {
			setSearchResult(undefined);
			return;
		}

		const res = instance.current.search(query);
		setSearchResult(res.map(s => s.item));
	}, []);

	const clearSearch = useCallback(() => {
		search('');
	}, [search]);

	return {
		searchResult,
		initialize,
		update,
		search,
		clearSearch,
	};
};
