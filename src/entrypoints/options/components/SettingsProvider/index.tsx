import type { FunctionComponent, VNode } from 'preact';
import { useLayoutEffect, useMemo, useState } from 'preact/hooks';

import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import { useMatchMedia } from '@/options/hooks/useMatchMedia';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';
import { useTabId } from '@/options/hooks/useTabId';
import { RawTheme, SYSTEM_LOCALE, Theme } from '@/storage/settings/types';
import { negotiateLanguages } from '@/translation/bundle';
import { type Settings, SettingsContext } from './context';

interface Props {
	children: VNode;
}

export const SettingsProvider: FunctionComponent<Props> = ({ children }) => {
	const { isTabIdLoaded } = useTabId();
	const { settingsStorage } = useLazyStorages();
	const settings = useStorageState({ storage: settingsStorage });
	const prefersDark = useMatchMedia('(prefers-color-scheme: dark)');

	const rawTheme =
		settings.status === StorageHookState.Loaded ? settings.data.theme : RawTheme.SYSTEM;
	const rawLocale =
		settings.status === StorageHookState.Loaded ? settings.data.locale : SYSTEM_LOCALE;

	const [resolvedLocales, setResolvedLocales] = useState(
		rawLocale === SYSTEM_LOCALE ? negotiateLanguages(navigator.languages) : [rawLocale],
	);

	const resolvedTheme =
		rawTheme === RawTheme.SYSTEM ? (prefersDark ? Theme.DARK : Theme.LIGHT) : rawTheme;

	useLayoutEffect(() => {
		setResolvedLocales(
			rawLocale === SYSTEM_LOCALE ? negotiateLanguages(navigator.languages) : [rawLocale],
		);

		if (rawLocale !== SYSTEM_LOCALE) {
			return;
		}

		const handleLanguageChange = () => {
			setResolvedLocales(negotiateLanguages(navigator.languages));
		};

		window.addEventListener('languagechange', handleLanguageChange);

		return () => {
			window.removeEventListener('languagechange', handleLanguageChange);
		};
	}, [rawLocale]);

	const ctx = useMemo(
		(): Settings => ({
			rawLocale,
			locales: resolvedLocales,
			rawTheme,
			theme: resolvedTheme,
		}),
		[rawLocale, resolvedLocales, rawTheme, resolvedTheme],
	);

	return (
		<SettingsContext.Provider value={ctx}>
			{settings.status !== StorageHookState.Loading && isTabIdLoaded ? children : null}
		</SettingsContext.Provider>
	);
};
