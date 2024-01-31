import type { Unwatch } from 'wxt/storage';

import { type BlockedChannelData, BlockedChannelsStorage } from '@/storage/blockedChannels';
import { l10n } from '@/translation/dom';
import type { Logger } from '@/utils/logger';

interface CreateOptions {
	source: string;
	logger: Logger;
	buttonId: string;
	buttonIdPrefix: string;
	followButtonSelector: string;
	followButtonActualButtonSelector: string;
	followButtonContainerSelector: string;
	followButtonTextSelector: string;
	followButtonTextDummySelector: string;
}

interface AddOptions {
	target: Element;
	channel: BlockedChannelData;
	onAdded?: (blockButton: HTMLElement, unsubscribe: Unwatch) => void;
}

export const createAddChannelBlockButton = ({
	source,
	logger: parentLogger,
	buttonId,
	buttonIdPrefix,
	followButtonSelector,
	followButtonActualButtonSelector,
	followButtonContainerSelector,
	followButtonTextSelector,
	followButtonTextDummySelector,
}: CreateOptions) => {
	const logger = parentLogger.getChildLogger('addChannelBlockButton');
	const blockedChannels = new BlockedChannelsStorage(source, logger);

	return async ({ target, channel, onAdded }: AddOptions) => {
		logger.debug('adding "Block" button for channel', channel, 'to node', target);

		const followButton = target.querySelector(followButtonSelector);

		if (!followButton) {
			logger.warn(
				'"Follow" button was not found with selector',
				followButtonSelector,
				'in node',
				target,
			);
			return;
		}

		logger.debug('adding "Block" button for channel', channel, 'to node', target);

		const blockButton = followButton.cloneNode(true) as HTMLElement;
		blockButton.id = buttonIdPrefix + buttonId;

		let unsubscribeListener: () => void;

		{
			const button = blockButton.querySelector(followButtonActualButtonSelector);
			const followButtonContainer = blockButton.querySelector(followButtonContainerSelector);
			const text = blockButton.querySelector(followButtonTextSelector);
			const textDummy = blockButton.querySelector(followButtonTextDummySelector);

			if (!text || !textDummy) {
				logger.warn(
					'there is no',
					followButtonTextSelector,
					'or',
					followButtonTextDummySelector,
					'in node',
					blockButton,
				);
				return;
			}

			let isBlocked = await blockedChannels.isBlocked(channel.id),
				isHovered = false;

			followButtonContainer?.classList.toggle('following', isBlocked);

			if (button) {
				button.classList.remove('-follow', '-on');
				button.classList.toggle('following', isBlocked);
			}

			logger.debug('setting up "blocked" listener for channel', channel);

			unsubscribeListener = blockedChannels.listenIsBlocked(channel.id, newIsBlocked => {
				isBlocked = newIsBlocked;
				followButtonContainer?.classList.toggle('following', isBlocked);
				button?.classList.toggle('following', isBlocked);
				updateTextContent();
			});

			const updateTextContent = () =>
				l10n.setAttributes(text, isBlocked ? (isHovered ? 'unblock' : 'blocked') : 'block', {});

			l10n.setAttributes(textDummy, 'unblock', {});
			updateTextContent();

			blockButton.addEventListener('click', () =>
				blockedChannels.setIsBlocked(channel, !isBlocked),
			);
			blockButton.addEventListener('mouseenter', () => {
				isHovered = true;
				updateTextContent();
			});
			blockButton.addEventListener('mouseleave', () => {
				isHovered = false;
				updateTextContent();
			});
		}

		const prevBlockButtonsIter = target
			.querySelectorAll(`[id^=${JSON.stringify(buttonIdPrefix)}]`)
			[Symbol.iterator]();

		let nextPrevBlockButton = prevBlockButtonsIter.next(),
			isBlockButtonReplaced = false;

		while (!nextPrevBlockButton.done) {
			const prevBlockButton = nextPrevBlockButton.value;
			nextPrevBlockButton = prevBlockButtonsIter.next();

			if (nextPrevBlockButton.done) {
				logger.debug('replacing last previous "Block" button', prevBlockButton);
				isBlockButtonReplaced = true;
				prevBlockButton.replaceWith(blockButton);
			} else {
				logger.debug('removing previous "Block" button', nextPrevBlockButton);
				nextPrevBlockButton.value.remove();
			}
		}

		if (!isBlockButtonReplaced) {
			logger.debug('rendering "Block" button to node', target);
			followButton.after(blockButton);
		}

		onAdded?.(blockButton, unsubscribeListener);
	};
};
