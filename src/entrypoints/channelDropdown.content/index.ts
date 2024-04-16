import type {} from 'typed-query-selector';

import { nanoid } from 'nanoid';

import { createAddChannelBlockButton } from '@/js/createAddChannelBlockButton';
import { Logger } from '@/utils/logger';

import './styles.scss';

const PREFIX = `${browser.runtime.id}__block__`;
// `:not(.channel-menu-dropdown)` excludes dropdown of the current user's profile
const DROPDOWN_SELECTOR =
	'.dropdown:not(.channel-menu-dropdown):not(.header__create-dropdown)' as const;
const CHANNEL_DROPDOWN_CONTENT_SELECTOR = '.channel--box-card' as const;
const CHANNEL_FOLLOW_BUTTON_SELECTOR = 'div.channel-follow-button' as const;
const CHANNEL_ID_ATTR = 'data-channel-id' as const;
const CHANNEL_TITLE_SELECTOR = '.channel__title' as const;
const CHANNEL_LINK_SELECTOR = '.channel__title > a' as const;

const isElement = (node: Node): node is Element => node.nodeType === node.ELEMENT_NODE;

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
	async main(ctx) {
		const ID = nanoid();
		const logger = Logger.create('channels dropdown cs', { devUniqueId: ID });

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

		try {
			const nodeToObserve = document.body;
			const addedNodes = new Map<Element, () => void>();

			const handleMutations: MutationCallback = async mutations => {
				for (const mutation of mutations) {
					if (mutation.removedNodes.length) {
						for (const [node, unregister] of addedNodes) {
							if (!node.isConnected) {
								unregister();
								addedNodes.delete(node);
							}
						}
					}

					if (mutation.addedNodes.length) {
						for (const addedNode of mutation.addedNodes) {
							// for (const channelDropdownContent of document.getElementsByClassName(
							//   'channel--box-card',
							// )) {
							// logger.debug(addedNode);
							if (isElement(addedNode) && addedNode.matches(DROPDOWN_SELECTOR)) {
								const channelDropdownContent = addedNode.querySelector(
									CHANNEL_DROPDOWN_CONTENT_SELECTOR,
								);

								if (!channelDropdownContent) {
									logger.warn(
										'channel dropdown content was not found with selector',
										CHANNEL_DROPDOWN_CONTENT_SELECTOR,
										'in node',
										addedNode,
									);
									continue;
								}

								logger.debug(
									'trying to get channel ID from attr',
									CHANNEL_ID_ATTR,
									'from node',
									channelDropdownContent,
								);

								const channelIdAttr = channelDropdownContent.getAttribute(CHANNEL_ID_ATTR);
								const channelId = channelIdAttr && Number.parseInt(channelIdAttr, 10);

								if (!Number.isInteger(channelId)) {
									logger.warn('value', channelIdAttr, 'is not a valid channel ID');
									continue;
								}

								const nodeWithChannelTitle =
									channelDropdownContent.querySelector(CHANNEL_TITLE_SELECTOR);

								if (!nodeWithChannelTitle) {
									logger.info(
										'there is no node with channel title found by selector',
										CHANNEL_TITLE_SELECTOR,
										'in node',
										channelDropdownContent,
									);
									continue;
								}

								const channelTitle =
									'innerText' in nodeWithChannelTitle &&
									typeof nodeWithChannelTitle.innerText === 'string'
										? nodeWithChannelTitle.innerText
										: nodeWithChannelTitle.textContent;

								if (channelTitle === null) {
									logger.warn(
										'`innerText` of the channel title node',
										nodeWithChannelTitle,
										"isn't a string",
										channelTitle,
									);
									continue;
								}

								let channelPermalink: string | undefined;

								try {
									const node = channelDropdownContent.querySelector(CHANNEL_LINK_SELECTOR);
									if (node) {
										channelPermalink = new URL(node.href).pathname.slice(1);
									} else {
										logger.warn(
											'there is no node with channel link found by selector',
											CHANNEL_LINK_SELECTOR,
											'in node',
											channelDropdownContent,
										);
									}
								} catch (err) {
									logger.error('failed to get channel permalink:', err);
								}

								const channelFollowButton = channelDropdownContent.querySelector(
									CHANNEL_FOLLOW_BUTTON_SELECTOR,
								);

								if (!channelFollowButton) {
									logger.warn(
										'"Follow" button wrapper was not found with selector',
										CHANNEL_FOLLOW_BUTTON_SELECTOR,
										'in node',
										channelDropdownContent,
									);
									continue;
								}

								addChannelBlockButton({
									target: channelFollowButton,
									channel: {
										id: channelId,
										title: channelTitle,
										permalink: channelPermalink,
									},
									onAdded(blockButton, unsubscribe) {
										addedNodes.set(blockButton, () => {
											logger.debug('removing channel', channelId, 'listener');
											unsubscribe();
										});
									},
								});
							}
						}
					}
				}
			};

			const observer = new MutationObserver(handleMutations);
			observer.observe(nodeToObserve, { childList: true });

			logger.debug('waiting for mutations of', nodeToObserve);

			ctx.onInvalidated(() => {
				observer.disconnect();

				for (const [node, unregister] of addedNodes) {
					unregister();
					node.remove();
				}
			});
		} catch (err) {
			logger.error(err);
		}
	},
});
