import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

import { logger } from '../constants';

let tabId: number | undefined = undefined;
let isTabIdLoading = false;
const isTabIdLoaded = signal(false);

export const useTabId = () => {
	useEffect(() => {
		if (!isTabIdLoaded.peek() && !isTabIdLoading) {
			isTabIdLoading = true;

			browser.tabs
				.getCurrent()
				.then(tab => (tabId = tab.id))
				.catch(logger.error)
				.finally(() => (isTabIdLoaded.value = true));
		}
	}, []);

	return {
		tabId,
		isTabIdLoaded,
	};
};
