import type { isObject as isObjectFn } from '@/helpers/isObject';
import type { JST_TEMPLATE_NAMES } from '@/types/jst';
import type { JST_ORIGINAL_TEMPLATES_KEY, JST_ORIGINAL_TEMPLATES_SYM } from './constants';

export function revertJstPatches(
	isObject: typeof isObjectFn,
	jstTemplateNames: typeof JST_TEMPLATE_NAMES,
	originalTemplatesKey: typeof JST_ORIGINAL_TEMPLATES_KEY,
	loggerPrefix = '',
	logger: Pick<Console, 'debug' | 'error'> = console,
	JST?: typeof window.JST,
) {
	const log = (method: keyof typeof logger, ...args: unknown[]) =>
		loggerPrefix ? logger[method](`[${loggerPrefix}]`, ...args) : logger[method](...args);

	try {
		if (!JST) {
			if ('JST' in window) {
				for (const name of jstTemplateNames) {
					if (Reflect.getOwnPropertyDescriptor(window.JST, name)?.set) {
						log('debug', `removing JST[${JSON.stringify(name)}] \`defineProperty\` patch`);

						Reflect.defineProperty(window.JST, name, {
							configurable: true,
							enumerable: true,
							writable: true,
							value: undefined,
						});
					}
				}
			}
		}
	} catch (err) {
		log('error', 'failed to remove JST `defineProperty` patches:', err);
	}

	JST ||= window.JST;

	try {
		if (isObject(JST)) {
			const originalTemplatesSym: typeof JST_ORIGINAL_TEMPLATES_SYM = Symbol.for(
				originalTemplatesKey,
			) as typeof JST_ORIGINAL_TEMPLATES_SYM;

			if (isObject(JST[originalTemplatesSym])) {
				for (const [name, orig] of Object.entries(JST[originalTemplatesSym])) {
					JST[name] = orig;
				}
			}

			delete JST[originalTemplatesSym];
		}
	} catch (err) {
		log('error', 'failed to restore original JST templates:', err);
	}
}
