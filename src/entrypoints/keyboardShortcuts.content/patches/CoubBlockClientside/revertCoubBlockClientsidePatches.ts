import type {
	CBC_GET_VIEWER_BLOCK_KEY,
	CBC_GET_VIEWER_BLOCK_SYM,
	CBC_VIEWER_BLOCK_KEY_UP_EVENT,
	CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_KEY,
	CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_SYM,
} from './constants';

export function revertCoubBlockClientsidePatches(
	getViewerBlockKey: typeof CBC_GET_VIEWER_BLOCK_KEY,
	viewerBlockKeyUpEvent: typeof CBC_VIEWER_BLOCK_KEY_UP_EVENT,
	viewerBlockKeyUpHandlersKey: typeof CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_KEY,
	loggerPrefix = '',
	logger: Pick<Console, 'debug' | 'error'> = console,
	proto?: typeof window.CoubBlockClientside.prototype,
) {
	const log = (method: keyof typeof logger, ...args: unknown[]) =>
		loggerPrefix ? logger[method](`[${loggerPrefix}]`, ...args) : logger[method](...args);

	if (!proto) {
		if (
			!('CoubBlockClientside' in window) ||
			Reflect.getOwnPropertyDescriptor(window, 'CoubBlockClientside')?.set
		) {
			log('debug', 'removing CoubBlockClientside `defineProperty` patch');

			return Reflect.defineProperty(window, 'CoubBlockClientside', {
				configurable: true,
				enumerable: true,
				writable: true,
				value: undefined,
			});
		}

		proto = window.CoubBlockClientside.prototype;
	}

	try {
		const getViewerBlockSym: typeof CBC_GET_VIEWER_BLOCK_SYM = Symbol.for(
			getViewerBlockKey,
		) as typeof CBC_GET_VIEWER_BLOCK_SYM;

		const origGetViewerBlock = proto[getViewerBlockSym];

		if (origGetViewerBlock) {
			proto.getViewerBlock = origGetViewerBlock;
			delete proto[getViewerBlockSym];
		}
	} catch (err) {
		log('error', 'failed to revert `getViewerBlock` patch:', err);
	}

	try {
		const viewerBlockKeyUpHandlersSym: typeof CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_SYM = Symbol.for(
			viewerBlockKeyUpHandlersKey,
		) as typeof CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_SYM;

		const viewerBlockKeyUpHandlers = proto[viewerBlockKeyUpHandlersSym];

		if (Array.isArray(viewerBlockKeyUpHandlers)) {
			let i = viewerBlockKeyUpHandlers.length;

			while (i--) {
				const entry = viewerBlockKeyUpHandlers[i];

				try {
					const [cbcRef, handler] = entry;
					const cbc = cbcRef.deref();

					if (!cbc) {
						viewerBlockKeyUpHandlers.splice(i, 1);
						continue;
					}

					if (handler) {
						cbc.getViewerBlock().off(viewerBlockKeyUpEvent, handler);
						entry[1] = undefined;
					}
				} catch (err) {
					log('error', 'failed to remove', viewerBlockKeyUpEvent, 'handler:', err);
				}
			}
		}
	} catch (err) {
		log('error', 'failed to remove', viewerBlockKeyUpEvent, 'handlers:', err);
	}
}
