import type { FluentBundle } from '@fluent/bundle';
import { mapBundleSync } from '@fluent/sequence';
import { CachedIterable } from 'indexed-iterable';

import { Logger } from '@/utils/logger';

import { generateBundles } from './bundle';

type FormatArgs = Parameters<FluentBundle['formatPattern']>[1];

const logger = Logger.create('l10n/js');
const errors: Error[] = [];
let bundlesCachedIter: Iterable<FluentBundle>, lastLocales: readonly string[];

export const setLocales = (locales: readonly string[]) => {
	if (locales !== lastLocales) {
		lastLocales = locales;
		bundlesCachedIter = new CachedIterable(generateBundles(locales));
	}
};

setLocales(navigator.languages);

window.addEventListener('languagechange', () => {
	logger.debug('languagechange', navigator.languages);
	setLocales(navigator.languages);
});

interface TransOptions {
	attr?: string;
	args?: FormatArgs;
}

export function t(id: string, opts?: TransOptions) {
	const ctx = mapBundleSync(bundlesCachedIter, id);

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
}
