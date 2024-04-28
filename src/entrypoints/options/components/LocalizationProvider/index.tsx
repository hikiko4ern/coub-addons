import {
	LocalizationProvider as FluentLocalizationProvider,
	ReactLocalization,
} from '@fluent/react';
import type { FunctionComponent } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import { Helmet } from 'react-helmet-async';

import { SettingsContext } from '@/options/components/SettingsProvider/context';
import { logger } from '@/options/constants';
import { type AvailableLocale, generateBundlesFromNegotiated } from '@/translation/bundle';
import { LocalizationContext } from './context';

const createInstance = (locales: readonly AvailableLocale[]): ReactLocalization => {
	logger.debug('creating `ReactLocalization` instance with locales', locales);

	return new ReactLocalization(generateBundlesFromNegotiated(locales));
};

export const LocalizationProvider: FunctionComponent = ({ children }) => {
	const { locales } = useContext(SettingsContext);
	const currentLocale = locales[0];

	const l10n = useMemo(() => createInstance(locales), [locales]);
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
