import { useSignal } from '@preact/signals';
import { Document, type DocumentData, Resolver, type ResolverOptions } from 'flexsearch';
import { useCallback, useRef } from 'preact/hooks';

import type { BlockedChannelData, ReadonlyBlockedChannels } from '@/storage/blockedChannels';

interface Doc extends Omit<BlockedChannelData, 'permalink'>, DocumentData {
	permalink: NonNullable<BlockedChannelData['permalink']> | null;
}

const normalizeDoc = (channel: Readonly<BlockedChannelData>): Doc =>
	typeof channel.permalink === 'undefined'
		? {
				...channel,
				permalink: null,
			}
		: (channel as Doc);

const encodeId = (id: unknown): string[] => [String(id)];

const encodeTitle = (str: string): string[] =>
	str
		.normalize('NFKC')
		.toLowerCase()
		.split(/[\p{Z}\p{S}\p{P}\p{C}]+/u);

export const useSearch = () => {
	const instance = useRef<Document<Doc>>();
	const searchResult = useSignal<BlockedChannelData[] | undefined>(undefined);

	const initializeIndex = useCallback(async (state: ReadonlyBlockedChannels) => {
		const initStart = performance.mark('BlockedChannels search index init start');

		try {
			const index = (instance.current = new Document<Doc>({
				document: {
					id: 'id',
					index: [
						{
							field: 'id',
							tokenize: 'exact',
							encode: encodeId,
						},
						{
							field: 'title',
							tokenize: 'full',
							encode: encodeTitle,
						},
						{
							field: 'permalink',
							tokenize: 'full',
							encode: encodeTitle,
						},
					],
				},
			}));

			for (const channel of state.channels.values()) {
				await index.addAsync(channel.id, normalizeDoc(channel));
			}
		} finally {
			performance.measure('BlockedChannels search index init', { start: initStart.startTime });
		}
	}, []);

	const updateIndex = useCallback(
		async (state: ReadonlyBlockedChannels, diff: ReadonlySet<number>) => {
			const index = instance.current;

			if (!index) {
				throw new Error('Index was not initialized');
			}

			for (const id of diff) {
				const item = state.channels.get(id);

				if (item) {
					await index.addAsync(item.id, normalizeDoc(item));
				} else {
					await index.removeAsync(id);
				}
			}
		},
		[],
	);

	const search = useCallback((state: ReadonlyBlockedChannels, query: string) => {
		const index = instance.current;

		if (!index) {
			throw new Error('Index was not initialized');
		}

		if (!query) {
			searchResult.value = undefined;
			return;
		}

		(async () => {
			const searchStart = performance.mark('BlockedChannels search start');

			try {
				const opts = { async: true, query } as const satisfies ResolverOptions<
					Doc,
					false,
					false,
					false,
					false,
					false,
					true
				>;

				const res = await new Resolver({ ...opts, index, field: 'title', boost: 2 })
					.or({ ...opts, field: 'permalink', boost: 0.5 })
					.or({ ...opts, field: 'id', boost: 0.5 })
					.resolve({ limit: Number.POSITIVE_INFINITY });

				searchResult.value = res.reduce<BlockedChannelData[]>((arr, id) => {
					const channel = state.channels.get(id as number);
					channel && arr.push(channel);
					return arr;
				}, []);
			} finally {
				performance.measure('BlockedChannels search', {
					start: searchStart.startTime,
					detail: {
						devtools: {
							properties: {
								query,
							},
						},
					},
				});
			}
		})();
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
