import type { UnknownRecord } from 'type-fest';
import type { WebRequest } from 'wxt/browser';

import { concatArrays } from '@/helpers/concatArrays';
import { isObject } from '@/helpers/isObject';
import type { GraphqlRequest, GraphqlResponse } from '@/types/graphql';
import { Logger } from '@/utils/logger';
import type { Context } from './ctx';

export type RequestDetails = WebRequest.OnBeforeRequestDetailsType;

type MaybePromise<T> = T | PromiseLike<T>;

type ExtraInfoSpec = Exclude<WebRequest.OnBeforeRequestOptions, 'blocking'>[];

interface OnBeforeRequestCtx {
	ctx: Context;
	details: RequestDetails;
	logger: Logger;
}

interface RewriteCompleteResponseOptions<CtxAddition extends object> {
	filter: WebRequest.RequestFilter;
	extraInfoSpec?: ExtraInfoSpec;
	rewrite: (
		ctx: CompleteResponseRewriterCtx & Partial<CtxAddition>,
	) => MaybePromise<Uint8Array | undefined>;
	isHandleRequest?: (
		ctx: OnBeforeRequestCtx & Partial<CtxAddition>,
	) => [isHandle: false, reason: string, ...logArgs: unknown[]] | [isHandle: true];
}

interface CompleteResponseRewriterCtx extends OnBeforeRequestCtx {
	data: Uint8Array;
}

interface RewriteCompleteJsonResponseOptions<T extends object, CtxAddition extends object>
	extends Omit<RewriteCompleteResponseOptions<CtxAddition>, 'rewrite'> {
	rewrite: (
		ctx: CompleteJsonResponseRewriterCtx<T> & Partial<CtxAddition>,
	) => MaybePromise<T | void>;
}

interface CompleteJsonResponseRewriterCtx<T extends object> extends OnBeforeRequestCtx {
	data: T;
}

interface RewriteCompleteGraphqlOptions<T extends object, CtxAddition extends object>
	extends RewriteCompleteJsonResponseOptions<T, CtxAddition> {
	ifQueriesFields?: (keyof T)[];
}

export class WebRequestExt implements Disposable {
	readonly #ctx: Context;
	readonly #unregisterHandlers: (() => void)[] = [];
	readonly #utf8Decoder = new TextDecoder('utf-8');

	constructor(ctx: Context) {
		this.#ctx = ctx;
	}

	rewriteCompleteResponse = <CtxAddition extends object = Record<never, never>>({
		filter,
		extraInfoSpec,
		rewrite,
		isHandleRequest,
	}: RewriteCompleteResponseOptions<CtxAddition>) => {
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

				const requestCtx: OnBeforeRequestCtx = { ctx: this.#ctx, details, logger };

				try {
					let isHandle = false,
						ignoreReason: unknown[] | undefined;

					if (
						typeof isHandleRequest === 'function' &&
						([isHandle, ...ignoreReason] = isHandleRequest(
							requestCtx as typeof requestCtx & CtxAddition,
						)) &&
						!isHandle
					) {
						logger.debug('ignoring request due to `isHandleRequest`:', ...ignoreReason);
						return;
					}
				} catch (err) {
					logger.error('`isHandleRequest` failed', err);
				}

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
						const processedRes = await rewrite(
							Object.assign<
								typeof requestCtx,
								Omit<CompleteResponseRewriterCtx, keyof typeof requestCtx>
							>(requestCtx, {
								data: buf,
							}) as CompleteResponseRewriterCtx & CtxAddition,
						);
						processedRes && (res = processedRes);
					}

					logger.debug('writing', res === buf ? 'unmodified' : 'modified', 'response');
					filter.write(res);
					filter.close();
				};

				return {};
			},
			filter,
			['blocking', ...(extraInfoSpec || [])],
		);
	};

	rewriteCompleteJsonResponse = <
		T extends object,
		CtxAddition extends object = Record<never, never>,
	>({
		rewrite,
		...options
	}: RewriteCompleteJsonResponseOptions<T, CtxAddition>) => {
		this.rewriteCompleteResponse({
			...options,
			rewrite: async ctx => {
				const responseStr = this.#utf8Decoder.decode(ctx.data);

				try {
					const res = JSON.parse(responseStr) as T;
					const processedRes = await rewrite({ ...ctx, data: res });

					if (typeof processedRes !== 'undefined') {
						const encoder = new TextEncoder();
						return encoder.encode(JSON.stringify(processedRes));
					}
				} catch (err) {
					ctx.logger.error('rewriting failed, leaving response untouched...', err);
				}
			},
		});
	};

	rewriteCompleteGraphql = <T extends object, CtxAddition extends object = Record<never, never>>({
		ifQueriesFields,
		extraInfoSpec,
		isHandleRequest,
		rewrite,
		...options
	}: RewriteCompleteGraphqlOptions<T, CtxAddition>) => {
		const fieldsRegex = ifQueriesFields?.length
			? new RegExp(`[:{}\\s](${ifQueriesFields.join('|')})[@({\\s]`)
			: undefined;

		this.rewriteCompleteJsonResponse<GraphqlResponse<T>>({
			...options,
			extraInfoSpec: ['requestBody', ...(extraInfoSpec || [])],
			isHandleRequest: ctx => {
				if (typeof isHandleRequest === 'function') {
					const res = isHandleRequest(ctx);

					if (!res[0]) {
						return res;
					}
				}

				if (ctx.details.method !== 'POST') {
					return [false, 'expected POST method, got', ctx.details.method];
				}

				const requestBody = ctx.details.requestBody;

				if (!requestBody?.raw?.[0]?.bytes) {
					return [false, 'expected raw body', requestBody];
				}

				if (!fieldsRegex) {
					return [true];
				}

				try {
					const { query } = JSON.parse(
						this.#utf8Decoder.decode(requestBody.raw[0].bytes),
					) as GraphqlRequest<UnknownRecord>;

					const isIncludesFields = fieldsRegex.test(query);

					return isIncludesFields
						? [true]
						: [false, 'selection set misses', ifQueriesFields, query];
				} catch (err) {
					ctx.logger.error('failed to check requestBody', err);
				}

				return [true];
			},
			rewrite: async ctx => {
				const res = ctx.data;

				if (!isObject(res) || 'errors' in res || !isObject(res.data)) {
					return;
				}

				const newData = await rewrite({ ...ctx, data: res.data } as typeof ctx & {
					data: (typeof res)['data'];
				} & CtxAddition);

				if (typeof newData !== 'undefined') {
					res.data = newData;
				}

				return res;
			},
		});
	};

	private onBeforeRequest = (
		handler: (details: RequestDetails) => void | WebRequest.BlockingResponseOrPromise,
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
