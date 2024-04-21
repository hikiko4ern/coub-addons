import type {
	H5P_ATTACH_EVENTS_KEY,
	H5P_ATTACH_EVENTS_SYM,
	H5P_KEY_UP_EVENT,
	H5P_KEY_UP_HANDLERS_KEY,
	H5P_KEY_UP_HANDLERS_SYM,
} from './constants';

export function revertHtml5PlayerPatches(
	attachEventsKey: typeof H5P_ATTACH_EVENTS_KEY,
	keyUpEvent: typeof H5P_KEY_UP_EVENT,
	keyUpHandlersKey: typeof H5P_KEY_UP_HANDLERS_KEY,
	loggerPrefix = '',
	logger: Pick<Console, 'debug' | 'error'> = console,
	proto?: typeof window.Html5Player.prototype,
) {
	const log = (method: keyof typeof logger, ...args: unknown[]) =>
		loggerPrefix ? logger[method](`[${loggerPrefix}]`, ...args) : logger[method](...args);

	if (!proto) {
		if (
			!('Html5Player' in window) ||
			Reflect.getOwnPropertyDescriptor(window, 'Html5Player')?.set
		) {
			log('debug', 'removing Html5Player `defineProperty` patch');

			return Reflect.defineProperty(window, 'Html5Player', {
				configurable: true,
				enumerable: true,
				writable: true,
				value: undefined,
			});
		}

		proto = window.Html5Player.prototype;
	}

	try {
		const attachEventsSym: typeof H5P_ATTACH_EVENTS_SYM = Symbol.for(
			attachEventsKey,
		) as typeof H5P_ATTACH_EVENTS_SYM;

		const origAttachEvents = proto[attachEventsSym];

		if (origAttachEvents) {
			proto.attachEvents = origAttachEvents;
			delete proto[attachEventsSym];
		}
	} catch (err) {
		log('error', 'failed to revert `attachEvents` patch:', err);
	}

	try {
		const keyUpHandlersSym: typeof H5P_KEY_UP_HANDLERS_SYM = Symbol.for(
			keyUpHandlersKey,
		) as typeof H5P_KEY_UP_HANDLERS_SYM;

		const keyUpHandlers = proto[keyUpHandlersSym];

		if (Array.isArray(keyUpHandlers)) {
			let i = keyUpHandlers.length;

			while (i--) {
				const entry = keyUpHandlers[i];

				try {
					const [playerRef, handler] = entry;
					const player = playerRef.deref();

					if (!player) {
						keyUpHandlers.splice(i, 1);
						continue;
					}

					if (handler) {
						player.vb.off(keyUpEvent, handler);
						entry[1] = undefined;
					}
				} catch (err) {
					log('error', 'failed to remove', keyUpEvent, 'handler:', err);
				}
			}
		}
	} catch (err) {
		log('error', 'failed to remove', keyUpEvent, 'handlers:', err);
	}
}
