import { chain, ifilter, imap, uniqueEverseen } from 'itertools';
import { createRouter } from 'radix3';

import '@/register';
import type {} from '@/types/tsPatch';

import { EventDispatcher, EventListener } from '@/events';
import { Context } from '@/request/ctx';
import { registerTimelineHandlers } from '@/request/timeline';
import { Logger } from '@/utils/logger';

declare global {
	var ctx: InstanceType<typeof Context>;
}

export default defineBackground(() => {
	browser.browserAction.onClicked.addListener(() => browser.runtime.openOptionsPage());

	const logger = Logger.create('bg');

	const ctx = (globalThis.ctx = new Context(logger));

	const eventListener = new EventListener(logger, (event, sender, _sendResponse) => {
		if (browser.runtime.id !== sender.id) {
			return;
		}

		const sendResponse = _sendResponse as (data: unknown) => void;

		switch (event.type) {
			case 'GetTabId':
				return sendResponse(sender.tab?.id);

			default:
				(async () => {
					try {
						const allCoubTabIds = imap(
							ifilter(
								await browser.tabs.query({ url: `${ctx.origin}/*` }),
								tab => tab.discarded !== true && (!tab.url || !prohibitedRouter.lookup(tab.url)),
							),
							tab => tab.id,
						);

						for (const tabId of uniqueEverseen(chain([sender.tab?.id], allCoubTabIds))) {
							if (typeof tabId === 'number') {
								EventDispatcher.dispatch(`tab ${tabId}`, event, event =>
									browser.tabs.sendMessage(tabId, event),
								);
							}
						}
					} catch (err) {
						logger.error('failed to broadcast message:', err);
					}
				})();
		}
	});

	registerTimelineHandlers(ctx);

	const prohibitedRouter = createRouter({
		routes: {
			[`${ctx.origin}/chat`]: void 0,
			[`${ctx.origin}/chat/*`]: void 0,
			[`${ctx.origin}/account/*`]: void 0,
			[`${ctx.origin}/official/*`]: void 0,
			[`${ctx.origin}/brand-assets`]: void 0,
			[`${ctx.origin}/tos`]: void 0,
			[`${ctx.origin}/privacy`]: void 0,
			[`${ctx.origin}/rules`]: void 0,
			[`${ctx.origin}/dmca`]: void 0,
		},
	});

	browser.runtime.onSuspend.addListener(() => {
		eventListener[Symbol.dispose]();
		ctx[Symbol.dispose]();
	});
});
