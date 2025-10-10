import type { FluentBundle } from '@fluent/bundle';
import { mapBundleSync } from '@fluent/sequence';
import { CachedIterable } from 'indexed-iterable';

import { Logger } from '@/utils/logger';

import { generateBundles } from './bundle';
import { createTranslator } from './helpers/createTranslator';

const logger = Logger.create('l10n/js');
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

export const t = createTranslator(id => mapBundleSync(bundlesCachedIter, id));
