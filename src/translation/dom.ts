import { DOMLocalization } from '@fluent/dom';

import { Logger } from '@/utils/logger';

import { generateBundles } from './bundle';
import { setupL10nLocaleListener } from './listener';

const logger = Logger.create('l10n/dom');

const getWindowLocale = () => {
	try {
		const waivedWindow = window.wrappedJSObject || window;
		logger.debug('i18n:', waivedWindow.I18n);
		return waivedWindow.I18n.locale;
	} catch (err) {
		logger.warn('failed to get I18n.locale:', err);
	}
};

let windowLocale = getWindowLocale();

const initialLanguages = windowLocale
	? [windowLocale]
	: Array.isArray(navigator?.languages)
		? [...navigator.languages]
		: [];

logger.debug('creating DOMLocalization instance with languages', initialLanguages);

export const l10n = new DOMLocalization(initialLanguages, generateBundles);

const setLocales = (locales: string[]) => {
	l10n.resourceIds = locales;
	l10n.onChange();
};

export const initializeLocalesFromWindowIfNeeded = () => {
	if (!windowLocale) {
		windowLocale = getWindowLocale();

		if (windowLocale) {
			logger.debug('reinitialized with locales from I18n:', windowLocale);
			setLocales([windowLocale]);
		}
	}
};

l10n.connectRoot(document.documentElement);
l10n.translateRoots();

setupL10nLocaleListener(setLocales);
