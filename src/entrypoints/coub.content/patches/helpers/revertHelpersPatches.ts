import type {
	APPLICATION_ORIGINAL_SMART_DATE_TIME_KEY,
	APPLICATION_ORIGINAL_SMART_DATE_TIME_SYM,
} from './constants';

export function revertHelpersPatches(
	applicationOriginalSmartDateTimeKey: typeof APPLICATION_ORIGINAL_SMART_DATE_TIME_KEY,
	loggerPrefix = '',
	logger: Pick<Console, 'debug' | 'error'> = console,
	helpers?: typeof window.helpers,
) {
	const log = (method: keyof typeof logger, ...args: unknown[]) =>
		loggerPrefix ? logger[method](`[${loggerPrefix}]`, ...args) : logger[method](...args);

	if (!helpers) {
		if (!('helpers' in window) || Reflect.getOwnPropertyDescriptor(window, 'helpers')?.set) {
			log('debug', 'removing helpers `defineProperty` patch');

			return Reflect.defineProperty(window, 'helpers', {
				configurable: true,
				enumerable: true,
				writable: true,
				value: undefined,
			});
		}

		helpers = window.helpers;
	}

	try {
		if (helpers && 'Application' in helpers) {
			const origSmartDateTimeSym: typeof APPLICATION_ORIGINAL_SMART_DATE_TIME_SYM = Symbol.for(
				applicationOriginalSmartDateTimeKey,
			) as typeof APPLICATION_ORIGINAL_SMART_DATE_TIME_SYM;

			const Application = helpers.Application;
			const origSmartDateTime = Application[origSmartDateTimeSym];

			if (origSmartDateTime) {
				Application.smartDateTime = origSmartDateTime;
				delete Application[origSmartDateTimeSym];
			}
		}
	} catch (err) {
		log('error', 'failed to revert `Application.smartDateTime` patch:', err);
	}
}
