import { chain, ifilter, imap, uniqueEverseen } from 'itertools';
import { nanoid } from 'nanoid';
import { createRouter } from 'radix3';

import '@/register';
import type {} from '@/types/tsPatch';

import { EventDispatcher, EventListener } from '@/events';
import { registerCommentsHandlers } from '@/request/comments';
import { Context } from '@/request/ctx';
import { registerStoriesHandlers } from '@/request/stories';
import { registerTimelineHandlers } from '@/request/timeline';
import { setLocales, t } from '@/translation/js';
import { Logger } from '@/utils/logger';

declare global {
	var ctx: InstanceType<typeof Context>;
}

enum MenuItemId {
	TAG_LINK_COPY = 'tag-link/copy',
	TAG_LINK_BLOCK = 'tag-link/block',
}

export default defineBackground(() => {
	browser.browserAction.onClicked.addListener(() => browser.runtime.openOptionsPage());

	const logger = Logger.create('bg');
	const unloadStylesClassPrefix = `${browser.runtime.id}__unload-styles__`;
	const unloadStylesClass = `${unloadStylesClassPrefix}${nanoid()}`;

	const ctx = (globalThis.ctx = new Context(logger));

	browser.menus.create({
		id: MenuItemId.TAG_LINK_COPY,
		contexts: ['link'],
		targetUrlPatterns: [`${ctx.origin}/tags/*`],
		title: t('copy-tag'),
	});

	browser.menus.create({
		id: MenuItemId.TAG_LINK_BLOCK,
		contexts: ['link'],
		targetUrlPatterns: [`${ctx.origin}/tags/*`],
		title: t('block-tag'),
	});

	browser.menus.onClicked.addListener((info, tab) => {
		logger.debug('handling click on menu item', info.menuItemId, { info, tab });

		switch (info.menuItemId) {
			case MenuItemId.TAG_LINK_COPY: {
				info.linkText &&
					navigator.clipboard
						.writeText(info.linkText)
						.catch(err => logger.error('failed to copy tag', { info, tab }, err));
				break;
			}

			case MenuItemId.TAG_LINK_BLOCK: {
				info.linkText &&
					ctx.blockedTags
						.block(info.linkText)
						.catch(err => logger.error('failed to block tag', { info, tab }, err));
				break;
			}
		}
	});

	window.addEventListener('languagechange', () => {
		logger.debug('languagechange', navigator.languages);
		setLocales(navigator.languages);
		browser.menus.update(MenuItemId.TAG_LINK_COPY, { title: t('copy-tag') });
		browser.menus.update(MenuItemId.TAG_LINK_BLOCK, { title: t('block-tag') });
	});

	const eventListener = new EventListener(logger, (event, sender, _sendResponse) => {
		if (browser.runtime.id !== sender.id) {
			return;
		}

		const sendResponse = _sendResponse as (data: unknown) => void;

		switch (event.type) {
			case 'GetTabId':
				return sendResponse(sender.tab?.id);

			case 'GetUnloadStylesClassWithPrefix': {
				return sendResponse([unloadStylesClassPrefix, unloadStylesClass]);
			}

			case 'GetUnloadStylesClass': {
				(async () => {
					try {
						logger.debug('inserting unload styles to tab', sender.tab?.id, 'frame', sender.frameId);
						await browser.tabs.insertCSS(sender.tab?.id, {
							code: `.${CSS.escape(unloadStylesClass)} { opacity: 0 !important; }`,
							frameId: sender.frameId,
							runAt: 'document_start',
						});
						sendResponse(unloadStylesClass);
					} catch (err) {
						logger.error('failed to insert unload styles:', err);
					}
				})();

				return true;
			}

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
	registerStoriesHandlers(ctx);
	registerCommentsHandlers(ctx);

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
