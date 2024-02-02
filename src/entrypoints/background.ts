import { chain, ifilter, imap, uniqueEverseen } from 'itertools';
import { createRouter } from 'radix3';

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

	const origin = import.meta.env.VITE_COUB_ORIGIN;

	const prohibitedRouter = createRouter({
		routes: {
			[`${origin}/chat`]: void 0,
			[`${origin}/chat/*`]: void 0,
			[`${origin}/account/*`]: void 0,
			[`${origin}/official/*`]: void 0,
			[`${origin}/brand-assets`]: void 0,
			[`${origin}/tos`]: void 0,
			[`${origin}/privacy`]: void 0,
			[`${origin}/rules`]: void 0,
			[`${origin}/dmca`]: void 0,
		},
	});

	browser.runtime.onSuspend.addListener(() => {
		ctx[Symbol.dispose]();
	});

	browser.runtime.onMessage.addListener(async (msg, sender) => {
		if (browser.runtime.id === sender.id) {
			try {
				const allCoubTabIds = imap(
					ifilter(
						await browser.tabs.query({ url: `${origin}/*` }),
						tab => tab.discarded !== true && (!tab.url || !prohibitedRouter.lookup(tab.url)),
					),
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
				logger.error('failed to broadcast message:', err);
			}
		}
	});
});
