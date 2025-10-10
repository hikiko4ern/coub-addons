import type { FluentBundle } from '@fluent/bundle';

type FormatArgs = Parameters<FluentBundle['formatPattern']>[1];

interface TranslateOptions {
	attr?: string;
	args?: FormatArgs;
}

const logger = Logger.create('l10n/t');

export const createTranslator = (getBundle: (id: string) => FluentBundle | null) => {
	const errors: Error[] = [];

	return function translate(id: string, opts?: TranslateOptions) {
		const ctx = getBundle(id);

		if (!ctx) {
			return id;
		}

		const msg = ctx.getMessage(id);
		const pattern = msg && (opts?.attr ? msg.attributes[opts.attr] : msg.value);

		if (!pattern) {
			return id;
		}

		const res = ctx.formatPattern(pattern, opts?.args, errors);

		if (errors.length > 0) {
			for (const err of errors) {
				logger.error(err);
			}
			errors.length = 0;
		}

		return res;
	};
};
