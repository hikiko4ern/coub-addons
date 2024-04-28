import { Localized, useLocalization } from '@fluent/react';
import ComputerDesktopIcon from '@heroicons/react/16/solid/ComputerDesktopIcon';
import LanguageIcon from '@heroicons/react/16/solid/LanguageIcon';
import MoonIcon from '@heroicons/react/16/solid/MoonIcon';
import PaintBrushIcon from '@heroicons/react/16/solid/PaintBrushIcon';
import SunIcon from '@heroicons/react/16/solid/SunIcon';
import { Select, SelectItem } from '@nextui-org/select';
import type { Selection } from '@react-types/shared';
import type { FunctionComponent, VNode } from 'preact';
import { useMemo } from 'preact/hooks';

import { CardSection } from '@/options/components/CardSection';
import { ErrorCode } from '@/options/components/ErrorCode';
import { HintTooltip } from '@/options/components/HintTooltip';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';
import type { Settings, SettingsStorage } from '@/storage/settings';
import { RawTheme, SYSTEM_LOCALE } from '@/storage/settings/types';
import { AVAILABLE_LOCALES } from '@/translation/bundle';

interface ThemeConfig {
	theme: RawTheme;
	icon: VNode;
}

const THEMES: ThemeConfig[] = [
	{
		theme: RawTheme.SYSTEM,
		icon: <ComputerDesktopIcon className="h-[theme(fontSize.small)]" />,
	},
	{
		theme: RawTheme.DARK,
		icon: <MoonIcon className="h-[theme(fontSize.small)]" />,
	},
	{
		theme: RawTheme.LIGHT,
		icon: <SunIcon className="h-[theme(fontSize.small)]" />,
	},
];

const LOCALES = [SYSTEM_LOCALE, ...AVAILABLE_LOCALES] as const;

const createSelectionHandler =
	(storage: SettingsStorage, key: keyof Settings) => (keys: Selection) => {
		if (keys === 'all') {
			return;
		}

		const item = keys.values().next();

		if (item.done) {
			return;
		}

		storage.mergeWith({ [key]: item.value as Settings[typeof key] });
	};

export const ExtensionSettings: FunctionComponent = () => {
	const { l10n } = useLocalization();
	const { settingsStorage } = useLazyStorages();
	const settings = useStorageState({ storage: settingsStorage });

	const rawTheme = settings.status === StorageHookState.Loaded ? settings.data.theme : undefined;
	const rawLocale = settings.status === StorageHookState.Loaded ? settings.data.locale : undefined;

	const selectedTheme = useMemo(() => (rawTheme ? [rawTheme] : []), [rawTheme]);
	const selectedLocale = useMemo(() => (rawLocale ? [rawLocale] : []), [rawLocale]);

	const handleThemeChange = useMemo(() => createSelectionHandler(settingsStorage, 'theme'), []);
	const handleLocaleChange = useMemo(() => createSelectionHandler(settingsStorage, 'locale'), []);

	const content = (() => {
		switch (settings.status) {
			case StorageHookState.Loaded: {
				return (
					<>
						<Localized id="theme-setting" attrs={{ label: true }}>
							<Select
								className="min-w-40"
								size="sm"
								fullWidth
								selectedKeys={selectedTheme}
								scrollShadowProps={{ isEnabled: false }}
								startContent={<PaintBrushIcon className="mt-1 h-[theme(fontSize.small)]" />}
								onSelectionChange={handleThemeChange}
							>
								{THEMES.map(({ theme, icon }) => {
									const tId = `theme-setting-${theme}`;

									return (
										<SelectItem
											key={theme}
											value={theme}
											textValue={l10n.getString(tId)}
											startContent={icon}
										>
											<Localized id={tId} />
										</SelectItem>
									);
								})}
							</Select>
						</Localized>

						<Localized id="locale-setting" attrs={{ label: true }}>
							<Select
								className="min-w-40"
								size="sm"
								fullWidth
								selectedKeys={selectedLocale}
								scrollShadowProps={{ isEnabled: false }}
								startContent={<LanguageIcon className="mt-1 h-[theme(fontSize.small)]" />}
								onSelectionChange={handleLocaleChange}
							>
								{LOCALES.map(locale => {
									const tId = `locale-setting-${locale}`;

									return (
										<SelectItem key={locale} value={locale} textValue={l10n.getString(tId)}>
											<Localized id={tId} />
										</SelectItem>
									);
								})}
							</Select>
						</Localized>
					</>
				);
			}

			case StorageHookState.Loading:
				return <Localized id="loading" />;

			case StorageHookState.Error:
				return <ErrorCode data={settings.error} />;
		}
	})();

	return (
		<CardSection
			bodyClassName="self-stretch gap-4"
			title={
				<>
					<Localized id="extension" />

					<HintTooltip iconClassName="ml-1" placement="right-start">
						<Localized id="extension-settings-tooltip" />
					</HintTooltip>
				</>
			}
		>
			{content}
		</CardSection>
	);
};
