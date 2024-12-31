import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { useWatchingRef } from '@/hooks/useWatchingRef';
import { logger as optionsLogger } from '@/options/constants';
import type { IsBlockedFn, PhrasesBlocklistStorage } from '@/storage/phrasesBlocklist';

interface Options {
	storage: PhrasesBlocklistStorage<string>;
	raw: string | false;
	onMatch: (pos: number | undefined) => void;
}

const logger = optionsLogger.getChildLogger('useTestPhrasesBlocklist');

export const useTestPhrasesBlocklist = ({ storage, raw, onMatch }: Options) => {
	const [testQuery, setTestQuery] = useState('');
	const [isTestQueryMatched, setIsTestQueryMatched] = useState<boolean>();

	const [testIsBlocked, setTestIsBlocked] = useState<IsBlockedFn>();
	const abortIsBlockedCreation = useRef<AbortController>();

	const onMatchRef = useWatchingRef(onMatch);

	useEffect(() => {
		setTestIsBlocked(undefined);

		if (typeof raw === 'string') {
			const controller = (abortIsBlockedCreation.current = new AbortController());

			storage
				.createBoundedIsBlocked()
				.then(isBlocked => {
					if (!controller.signal.aborted) {
						setTestIsBlocked(() => isBlocked);
					}
				})
				.catch(logger.error);
		}

		return () => {
			abortIsBlockedCreation.current?.abort();
		};
	}, [storage, raw]);

	const matchTestQuery = useCallback(
		(query: string) => {
			if (!query) {
				setIsTestQueryMatched(undefined);
				onMatchRef.current(undefined);
				return;
			}

			if (typeof testIsBlocked !== 'function') {
				return;
			}

			const matched = testIsBlocked(query);

			if (typeof matched !== 'undefined') {
				setIsTestQueryMatched(true);
				onMatchRef.current(matched[1]);
				return;
			}

			setIsTestQueryMatched(false);
			onMatchRef.current(undefined);
		},
		[testIsBlocked],
	);

	useEffect(() => {
		typeof testIsBlocked === 'function' && testQuery && matchTestQuery(testQuery);
	}, [testIsBlocked]);

	const handleTestQueryInput = useCallback(
		(query: string) => {
			setTestQuery(query);
			matchTestQuery(query);
		},
		[matchTestQuery],
	);

	const clearTestQuery = useCallback(() => {
		setTestQuery('');
		setIsTestQueryMatched(undefined);
	}, []);

	return {
		testQuery,
		isTestQueryMatched,
		handleTestQueryInput,
		clearTestQuery,
	};
};
