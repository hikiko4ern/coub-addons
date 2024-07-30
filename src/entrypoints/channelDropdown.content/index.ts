import { nanoid } from 'nanoid';
import type {} from 'typed-query-selector';

import { isObject } from '@/helpers/isObject';
import { applyPatches } from '@/helpers/patch/applyPatches';
import { createAddChannelBlockButton } from '@/js/createAddChannelBlockButton';
import { Logger } from '@/utils/logger';
import { onContentScriptUnload } from '@/utils/unloadHandler/onContentScriptUnload';
import { removeOldUnloadHandlers } from '@/utils/unloadHandler/removeOldUnloadHandlers';

import { CD_ADDED_NODES_KEY, CD_ADDED_NODES_SYM } from './constants';
import { addBlockButtonToChannelDropdown } from './helpers/addBlockButtonToChannelDropdown';
import {
	CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_KEY,
	patchWidgets,
	revertWidgetsPatches,
} from './patches/widgets';
import type { ChannelDropdownAddedNodes } from './types';

import './styles.scss';

const PREFIX = `${browser.runtime.id}__block__`;
const UNLOAD_HANDLERS_SUFFIX = 'channelDropdown';

const CHANNEL_DROPDOWN_CONTENT_SELECTOR = '.channel--box-card' as const;

type Patches = {
	[key in typeof CD_ADDED_NODES_SYM]?: ChannelDropdownAddedNodes;
};

declare global {
	interface Window extends Patches {}
}

export default defineContentScript({
	matches: [`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/*`],
	excludeMatches: [
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/chat`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/chat/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/account/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/official/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/brand-assets`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/tos`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/privacy`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/rules`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/dmca`,
	],
	runAt: 'document_start',
	async main(ctx) {
		const ID = nanoid();
		const logger = Logger.create('channel dropdown cs', { devUniqueId: ID });

		try {
			await removeOldUnloadHandlers(UNLOAD_HANDLERS_SUFFIX);
		} catch (err) {
			logger.error('failed to remove unload handlers:', err);
		}

		const waivedWindow = window.wrappedJSObject || window;

		try {
			const addChannelBlockButton = createAddChannelBlockButton({
				source: 'channel dropdown',
				logger,
				buttonId: ID,
				buttonIdPrefix: PREFIX,
				followButtonSelector: '.follow-btn',
				followButtonActualButtonSelector: ':where(.follow-button__container, .follow-btn) > button',
				followButtonContainerSelector:
					'.follow-button__container, .follow-btn:not([data-channel-id])',
				followButtonTextSelector: '.text',
				followButtonTextDummySelector: '.text-dummy',
				followButtonTextDummyClassName: 'text-dummy',
			});

			const oldAddedNodes = waivedWindow[CD_ADDED_NODES_SYM];
			const addedNodes: ChannelDropdownAddedNodes = (waivedWindow[CD_ADDED_NODES_SYM] = cloneInto(
				[],
				waivedWindow,
			));

			const handleDocumentReadyStateChanged = () => {
				if (document.readyState === 'complete') {
					const channelDropdownsContents = document.querySelectorAll(
						CHANNEL_DROPDOWN_CONTENT_SELECTOR,
					);

					logger.debug('readyState changed to', document.readyState, channelDropdownsContents);

					for (const channelDropdownContent of channelDropdownsContents) {
						addBlockButtonToChannelDropdown(
							logger,
							addedNodes,
							addChannelBlockButton,
							channelDropdownContent,
						);
					}
				}
			};

			document.addEventListener('readystatechange', handleDocumentReadyStateChanged);

			{
				let isCloseGroup = false;

				try {
					if (Array.isArray(oldAddedNodes) && oldAddedNodes.length > 0) {
						logger.groupCollapsed('reinitializing `addedNodes`');
						isCloseGroup = true;

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

							let isCloseGroup = false;

							try {
								const channelDropdownContent = entry[0]?.deref();

								if (channelDropdownContent) {
									logger.groupCollapsed(i, 'reinitializing', channelDropdownContent);
									isCloseGroup = true;

									addBlockButtonToChannelDropdown(
										logger,
										addedNodes,
										addChannelBlockButton,
										channelDropdownContent,
									);
								}
							} catch (err) {
								logger.error(i, 'failed to reinitialize', err);
							} finally {
								isCloseGroup && logger.groupEnd();
							}
						}
					}
				} catch (err) {
					logger.error('failed to reinitialize `addedNodes`', err);
				} finally {
					isCloseGroup && logger.groupEnd();
				}
			}

			const patches = applyPatches(
				logger,
				waivedWindow,
				{
					widgets: patchWidgets,
				},
				waivedWindow,
				addedNodes,
				addChannelBlockButton,
			);

			const removeUnloadHandler = await onContentScriptUnload(
				UNLOAD_HANDLERS_SUFFIX,
				(
					loggerPrefix,
					// helpers
					isObject,
					// window
					addedNodesKey,
					// widgets
					channelDropdownSetDropdownContentOrigKey,
					revertWidgetsPatches,
				) => {
					console.debug(`[${loggerPrefix}]`, 'reverting patches');

					revertWidgetsPatches(
						isObject,
						addedNodesKey,
						channelDropdownSetDropdownContentOrigKey,
						loggerPrefix,
					);
				},
				logger.prefix,
				// helpers
				isObject,
				// window
				CD_ADDED_NODES_KEY,
				// widgets
				CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_KEY,
				revertWidgetsPatches,
			);

			ctx.onInvalidated(() => {
				document.removeEventListener('readystatechange', handleDocumentReadyStateChanged);

				removeUnloadHandler?.();

				for (const revert of patches) {
					revert?.();
				}
			});
		} catch (err) {
			logger.error('failed to apply patches:', err);
		}
	},
});
