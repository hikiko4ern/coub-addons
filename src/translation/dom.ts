import { DOMLocalization } from '@fluent/dom';

import { locale } from '@/js/siteLocale';
import { Logger } from '@/utils/logger';

import { generateBundles } from './bundle';
import { setupL10nLocaleListener } from './listener';

const logger = Logger.create('l10n/dom');

const languages = locale
	? [locale]
	: Array.isArray(navigator?.languages)
	  ? [...navigator.languages]
	  : [];
logger.debug('creating DOMLocalization instance with languages', languages);

export const l10n = new DOMLocalization(languages, generateBundles);

l10n.connectRoot(document.documentElement);
l10n.translateRoots();

setupL10nLocaleListener(locales => {
	l10n.resourceIds = locales;
	l10n.onChange();
});
