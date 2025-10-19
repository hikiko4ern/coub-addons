import type { createAddChannelBlockButton } from '@/js/createAddChannelBlockButton';
import type { Logger } from '@/utils/logger';

import { CD_ADDED_NODES_SYM } from '../constants';
import type { ChannelDropdownAddedNodes } from '../types';
import { addBlockButtonToChannelDropdown } from './addBlockButtonToChannelDropdown';

export const reinitializeChannelDropdowns = (
	parentLogger: Logger,
	waivedWindow: typeof window,
	addedNodes: ChannelDropdownAddedNodes,
	addChannelBlockButton: ReturnType<typeof createAddChannelBlockButton>,
) => {
	const oldAddedNodes = waivedWindow[CD_ADDED_NODES_SYM];

	if (Array.isArray(oldAddedNodes) && oldAddedNodes.length > 0) {
		using logger = parentLogger.scopedGroupAuto('reinitializing `addedNodes`');

		for (const [i, entry] of oldAddedNodes.entries()) {
			try {
				const unregister = entry[2]?.deref();
				unregister?.();
			} catch (err) {
				// it's ok... sometimes
				if (!(err instanceof Error) || !err.message.includes('dead object')) {
					logger.error(i, 'failed to unregister', err);
				}
			}

			try {
				const node = entry[1]?.deref();
				node?.remove();
			} catch (err) {
				logger.error(i, 'failed to remove node', err);
			}

			try {
				const channelDropdownContent = entry[0]?.deref();

				if (channelDropdownContent) {
					using _ = logger.scopedGroupAuto(i, 'reinitializing', channelDropdownContent);

					addBlockButtonToChannelDropdown(
						logger,
						addedNodes,
						addChannelBlockButton,
						channelDropdownContent,
					);
				}
			} catch (err) {
				logger.error(i, 'failed to reinitialize', err);
			}
		}
	}
};
