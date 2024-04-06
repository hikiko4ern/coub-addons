import { type FluentBundle, FluentType, type Scope } from '@fluent/bundle';
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
	logger.debug('translating', id, 'with options', opts);

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

declare module '@fluent/bundle/esm/scope' {
	export interface Scope {
		memoizeIntlObject(ctor: typeof Intl.ListFormat, opts: Intl.ListFormatOptions): Intl.ListFormat;
	}
}

export class FluentList extends FluentType<Iterable<string>> {
	private opts: Intl.ListFormatOptions;

	constructor(value: Iterable<string>, opts: Intl.ListFormatOptions) {
		super(value);
		this.opts = opts;
	}

	toString(scope: Scope): string {
		try {
			const lf = scope.memoizeIntlObject(Intl.ListFormat, this.opts);
			return lf.format(this.value);
		} catch (err) {
			scope.reportError(err);
			return Array.isArray(this.value) ? this.value.join(', ') : Array.from(this.value).join(', ');
		}
	}
}
