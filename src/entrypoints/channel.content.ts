import type {} from 'typed-query-selector';

import { nanoid } from 'nanoid';

import { createAddChannelBlockButton } from '@/js/createAddChannelBlockButton';
import { getChannelDataFromWindow } from '@/js/getChannelDataFromWindow';
import type { BlockedChannelData } from '@/storage/blockedChannels';
import { Logger } from '@/utils/logger';

const PREFIX = `${browser.runtime.id}__block__`;
const CHANNEL_BUTTONS_SELECTOR = 'div.channel__buttons' as const;
const CHANNEL_ID_ATTR = 'data-channel-id' as const;
const CHANNEL_ID_ATTR_SELECTOR = `[${CHANNEL_ID_ATTR}]` as const;
const CHANNEL_TITLE_ATTR = 'title' as const;
const CHANNEL_TITLE_ATTR_SELECTOR = `.channel__description [${CHANNEL_TITLE_ATTR}]` as const;

export default defineContentScript({
	matches: [`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/*`],
	excludeMatches: [
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/view/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/feed`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/stories`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/stories/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/hot`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/rising`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/fresh`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/random`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/best/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/weekly/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/featured/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/likes`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/likes/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/bookmarks`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/bookmarks/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/community/*`,
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
		const logger = Logger.create('channels cs', { devUniqueId: ID });

		const addChannelBlockButton = createAddChannelBlockButton({
			source: 'channel',
			logger,
			buttonId: ID,
			buttonIdPrefix: PREFIX,
			followButtonSelector: '.channel__relationships__follow',
			followButtonActualButtonSelector: '.follow-button__container > button',
			followButtonContainerSelector: '.follow-button__container',
			followButtonTextSelector: '.text',
			followButtonTextDummySelector: '.text-dummy',
		});

		try {
			let blockButton: HTMLElement, unsubscribe: () => void;

			const channelButtons = document.querySelector(CHANNEL_BUTTONS_SELECTOR);

			const addBlockButton = (target: Element) => {
				let channel: BlockedChannelData | undefined = getChannelDataFromWindow();

				if (!channel) {
					logger.debug('trying to get channel ID with the selector', CHANNEL_ID_ATTR_SELECTOR);

					const nodeWithChannelId = document.querySelector(CHANNEL_ID_ATTR_SELECTOR);

					if (!nodeWithChannelId) {
						return logger.info(
							'there is no node with channel ID attr found by selector',
							CHANNEL_ID_ATTR_SELECTOR,
							"(maybe this is not user's profile page?)",
						);
					}

					const nodeWithChannelTitle = document.querySelector(CHANNEL_TITLE_ATTR_SELECTOR);

					if (!nodeWithChannelTitle) {
						return logger.info(
							"there's no node with Channel title found by selector",
							CHANNEL_TITLE_ATTR_SELECTOR,
							"(maybe this is not user's profile page?)",
						);
					}

					// biome-ignore lint/style/noNonNullAssertion: attr existence is checked by `CHANNEL_ID_ATTR_SELECTOR`
					const channelIdAttr = nodeWithChannelId.getAttribute(CHANNEL_ID_ATTR)!;
					const channelId = Number.parseInt(channelIdAttr, 10);

					if (!Number.isInteger(channelId)) {
						return logger.warn('value', channelIdAttr, 'is not a valid channel ID');
					}

					channel = {
						id: channelId,
						// biome-ignore lint/style/noNonNullAssertion: attr existence is checked by `CHANNEL_TITLE_ATTR_SELECTOR`
						title: nodeWithChannelTitle.getAttribute(CHANNEL_TITLE_ATTR)!,
						permalink: undefined,
					};
				}

				addChannelBlockButton({
					target,
					channel,
					onAdded(_blockButton, _unsubscribe) {
						blockButton = _blockButton;
						unsubscribe = _unsubscribe;
					},
				});
			};

			if (channelButtons) {
				addBlockButton(channelButtons);

				ctx.onInvalidated(() => {
					logger.warn('invalidated');
					unsubscribe();
					blockButton.remove();
				});
			} else {
				logger.warn('there is no channel buttons node found by selector', CHANNEL_BUTTONS_SELECTOR);
			}
		} catch (err) {
			logger.error(err);
		}
	},
});
