import { chain, imap, uniqueEverseen } from 'itertools';

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
				const allCoubTabIds = imap(
					await browser.tabs.query({
						// TODO: manually exclude patterns from content scripts' `excludeMatches`
						url: `${import.meta.env?.VITE_COUB_ORIGIN}/*`,
					}),
					tab => tab.id,
				);

				for (const tabId of uniqueEverseen(chain([sender.tab?.id], allCoubTabIds))) {
					if (typeof tabId === 'number') {
						EventDispatcher.dispatch(`tab ${tabId}`, msg, event =>
							browser.tabs.sendMessage(tabId, event),
						);
					}
				}
			} catch (err) {
				logger.error('failed to query tabs:', err);
			}
		}
	});
});
