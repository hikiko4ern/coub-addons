import type { H5PG_UI_ORIG_INIT_KEY, H5PG_UI_ORIG_INIT_SYM } from './constants';

export function revertHtml5PlayerGlobalPatches(
	uiOrigInitKey: typeof H5PG_UI_ORIG_INIT_KEY,
	loggerPrefix = '',
	logger: Pick<Console, 'debug' | 'error'> = console,
	html5Player?: typeof window.html5Player,
) {
	const log = (method: keyof typeof logger, ...args: unknown[]) =>
		loggerPrefix ? logger[method](`[${loggerPrefix}]`, ...args) : logger[method](...args);

	if (!html5Player) {
		if (
			!('html5Player' in window) ||
			Reflect.getOwnPropertyDescriptor(window, 'html5Player')?.set
		) {
			log('debug', 'removing html5Player `defineProperty` patch');

			return Reflect.defineProperty(window, 'html5Player', {
				configurable: true,
				enumerable: true,
				writable: true,
				value: undefined,
			});
		}

		html5Player = window.html5Player;
	}

	const UI = html5Player.UI;

	if (!UI) {
		if (Reflect.getOwnPropertyDescriptor(html5Player, 'UI')?.set) {
			log('debug', 'removing html5Player.UI `defineProperty` patch');

			return Reflect.defineProperty(html5Player, 'UI', {
				configurable: true,
				enumerable: true,
				writable: true,
				value: undefined,
			});
		}

		return;
	}

	try {
		const uiOrigInitSym: typeof H5PG_UI_ORIG_INIT_SYM = Symbol.for(
			uiOrigInitKey,
		) as typeof H5PG_UI_ORIG_INIT_SYM;

		const origInit = UI.prototype[uiOrigInitSym];

		if (origInit) {
			UI.prototype.init = origInit;
			delete UI.prototype[uiOrigInitSym];
		}
	} catch (err) {
		log('error', 'failed to revert `UI.init` patch:', err);
	}
}
