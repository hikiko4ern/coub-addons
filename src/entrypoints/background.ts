import '@/register';
import type {} from '@/types/tsPatch';

import { EventDispatcher } from '@/events';
import { Context } from '@/request/ctx';
import { registerTimelineHandlers } from '@/request/timeline';
import { Logger } from '@/utils/logger';

export default defineBackground(() => {
	const logger = Logger.create('bg');

	const ctx = new Context(logger);
	registerTimelineHandlers(ctx);

	browser.runtime.onSuspend.addListener(() => {
		ctx[Symbol.dispose]();
	});

	browser.runtime.onMessage.addListener(async (msg, sender) => {
		if (browser.runtime.id === sender.id) {
			try {
				const senderTabId = sender.tab?.id;

				if (typeof senderTabId === 'number') {
					EventDispatcher.dispatch(`tab ${senderTabId}`, msg, event =>
						browser.tabs.sendMessage(senderTabId, event),
					);
				}
			} catch (err) {
				logger.error('failed to query tabs:', err);
			}
		}
	});
});
