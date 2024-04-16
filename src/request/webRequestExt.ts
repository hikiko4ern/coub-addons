import type { WebRequest } from 'wxt/browser';

import { Logger } from '@/utils/logger';

import { concatArrays } from '@/helpers/concatArrays';
import type { Context } from './ctx';

export type RequestDetails = WebRequest.OnBeforeRequestDetailsType;

type MaybePromise<T> = T | PromiseLike<T>;

interface CompleteResponseRewriterCtx {
	details: RequestDetails;
	data: Uint8Array;
	logger: Logger;
}

interface CompleteJsonResponseRewriterCtx<T> {
	details: RequestDetails;
	data: T;
	logger: Logger;
}

export class WebRequestExt implements Disposable {
	readonly #ctx: Context;
	readonly #unregisterHandlers: (() => void)[] = [];

	constructor(ctx: Context) {
		this.#ctx = ctx;
	}

	rewriteCompleteResponse = (
		filter: WebRequest.RequestFilter,
		rewriter: (ctx: CompleteResponseRewriterCtx) => MaybePromise<Uint8Array | undefined>,
	) => {
		this.onBeforeRequest(
			details => {
				const { requestId } = details;

				let loggerPrefix = requestId;

				if ('originUrl' in details && details.originUrl) {
					let url = details.originUrl;
					try {
						const originUrl = new URL(details.originUrl);

						if (originUrl.origin === this.#ctx.origin) {
							url = details.originUrl.slice(originUrl.origin.length);
						}
					} catch {
						// noop
					}
					loggerPrefix = `${url} | ${loggerPrefix}`;
				}

				const logger = Logger.create(loggerPrefix);
				logger.debug('gonna rewrite request', details);

				const filter = browser.webRequest.filterResponseData(requestId);
				const buffers: Uint8Array[] = [];

				// cSpell:ignore ondata
				filter.ondata = event => {
					buffers.push(new Uint8Array(event.data));
				};

				filter.onstop = async () => {
					const buf = concatArrays(buffers);
					let res: Uint8Array = buf;

					if (buffers.length) {
						const processedRes = await rewriter({
							details,
							data: buf,
							logger,
						});
						processedRes && (res = processedRes);
					}

					logger.debug('writing', res === buf ? 'unmodified' : 'modified', 'response');
					filter.write(res);
					filter.close();
				};

				return {};
			},
			filter,
			['blocking'],
		);
	};

	rewriteCompleteJsonResponse = <T>(
		filter: WebRequest.RequestFilter,
		parse: (data: string) => T,
		rewriter: (ctx: CompleteJsonResponseRewriterCtx<T>) => MaybePromise<T | undefined>,
	) => {
		this.rewriteCompleteResponse(filter, async ({ data, ...ctx }) => {
			const decoder = new TextDecoder('utf-8');
			const responseStr = decoder.decode(data);

			try {
				const res = parse(responseStr);
				const processedRes = await rewriter({ ...ctx, data: res });

				if (typeof processedRes !== 'undefined') {
					const encoder = new TextEncoder();
					return encoder.encode(JSON.stringify(processedRes));
				}
			} catch (err) {
				ctx.logger.error('rewriting failed, leaving response untouched...', err);
			}
		});
	};

	onBeforeRequest = (
		handler: (details: RequestDetails) => void,
		filter: WebRequest.RequestFilter,
		extraInfoSpec?: WebRequest.OnBeforeRequestOptions[],
	): void => {
		browser.webRequest.onBeforeRequest.addListener(
			handler,
			{
				...filter,
				urls: filter.urls.map(url => new URL(url, this.#ctx.origin).toString()),
			},
			extraInfoSpec,
		);
		this.#unregisterHandlers.push(() => browser.webRequest.onBeforeRequest.removeListener(handler));
	};

	[Symbol.dispose]() {
		for (const unregister of this.#unregisterHandlers) {
			unregister();
		}
	}
}
