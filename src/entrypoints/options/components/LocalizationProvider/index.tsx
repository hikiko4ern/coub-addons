import {
	LocalizationProvider as FluentLocalizationProvider,
	ReactLocalization,
} from '@fluent/react';
import type { FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';
import { Helmet } from 'react-helmet-async';

import { logger } from '@/options/constants';
import {
	type AvailableLocale,
	generateBundlesFromNegotiated,
	negotiateLanguages,
} from '@/translation/bundle';

import { LocalizationContext } from './context';

const createInstance = (
	userLocales: readonly string[],
): [readonly AvailableLocale[], ReactLocalization] => {
	logger.debug('creating `ReactLocalization` instance with languages', userLocales);

	const currentLocales = negotiateLanguages(userLocales);
	return [currentLocales, new ReactLocalization(generateBundlesFromNegotiated(currentLocales))];
};

export const LocalizationProvider: FunctionComponent = ({ children }) => {
	const [currentLocales, l10n] = useMemo(() => createInstance(navigator.languages), []);
	const currentLocale = currentLocales[0];
	const lang = useMemo(() => currentLocale.split('-')[0], [currentLocale]);

	const ctx = useMemo(
		(): LocalizationContext => ({
			locale: currentLocale,
		}),
		[currentLocale],
	);

	return (
		<LocalizationContext.Provider value={ctx}>
			<Helmet htmlAttributes={{ lang }} />
			<FluentLocalizationProvider l10n={l10n}>{children}</FluentLocalizationProvider>
		</LocalizationContext.Provider>
	);
};
