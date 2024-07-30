import type { createAddChannelBlockButton } from '@/js/createAddChannelBlockButton';
import type { Logger } from '@/utils/logger';
import type { ChannelDropdownAddedNode, ChannelDropdownAddedNodes } from '../types';

const CHANNEL_FOLLOW_BUTTON_SELECTOR = 'div.channel-follow-button' as const;
const CHANNEL_ID_ATTR = 'data-channel-id' as const;
const CHANNEL_TITLE_SELECTOR = '.channel__title' as const;
const CHANNEL_LINK_SELECTOR = '.channel__title > a' as const;

export const addBlockButtonToChannelDropdown = (
	logger: Logger,
	addedNodes: ChannelDropdownAddedNodes,
	addChannelBlockButton: ReturnType<typeof createAddChannelBlockButton>,
	channelDropdownContent: Element,
	channelId?: number,
) => {
	logger.debug(
		'trying to get channel ID from attr',
		CHANNEL_ID_ATTR,
		'from node',
		channelDropdownContent,
	);

	if (typeof channelId !== 'number') {
		const channelIdAttr = channelDropdownContent.getAttribute(CHANNEL_ID_ATTR);
		const id = channelIdAttr && Number.parseInt(channelIdAttr, 10);

		if (!Number.isInteger(id)) {
			logger.warn('value', channelIdAttr, 'is not a valid channel ID');
			return;
		}

		channelId = id;
	}

	const nodeWithChannelTitle = channelDropdownContent.querySelector(CHANNEL_TITLE_SELECTOR);

	if (!nodeWithChannelTitle) {
		logger.info(
			'there is no node with channel title found by selector',
			CHANNEL_TITLE_SELECTOR,
			'in node',
			channelDropdownContent,
		);
		return;
	}

	const channelTitle =
		'innerText' in nodeWithChannelTitle && typeof nodeWithChannelTitle.innerText === 'string'
			? nodeWithChannelTitle.innerText
			: nodeWithChannelTitle.textContent;

	if (channelTitle === null) {
		logger.warn(
			'`innerText` of the channel title node',
			nodeWithChannelTitle,
			"isn't a string",
			channelTitle,
		);
		return;
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

	const channelFollowButton = channelDropdownContent.querySelector(CHANNEL_FOLLOW_BUTTON_SELECTOR);

	if (!channelFollowButton) {
		logger.warn(
			'"Follow" button wrapper was not found with selector',
			CHANNEL_FOLLOW_BUTTON_SELECTOR,
			'in node',
			channelDropdownContent,
		);
		return;
	}

	const waivedWindow = window.wrappedJSObject || window;
	const { WeakRef } = waivedWindow;

	addChannelBlockButton({
		target: channelFollowButton,
		channel: {
			id: channelId,
			title: channelTitle,
			permalink: channelPermalink,
		},
		onAdded(blockButton, unsubscribe) {
			const entry = cloneInto([] as unknown as ChannelDropdownAddedNode, window);
			addedNodes.push(entry);

			entry[0] = new WeakRef(channelDropdownContent);
			entry[1] = new WeakRef(blockButton);
			entry[2] = new WeakRef(
				exportFunction(() => {
					logger.debug('removing channel', channelId, 'listener');
					unsubscribe();
				}, waivedWindow),
			);
		},
	});
};
