import { FluentBundle, FluentResource } from '@fluent/bundle';
import { negotiateLanguages as fluentNegotiateLanguages } from '@fluent/langneg';

import { DEFAULT_LOCALE } from './constants';
import enUs from './data/en-US.ftl?raw';
import ruRu from './data/ru-RU.ftl?raw';

// Store all translations as a simple object which is available
// synchronously and bundled with the rest of the code.
const RESOURCES = {
	'ru-RU': new FluentResource(ruRu),
	'en-US': new FluentResource(enUs),
} satisfies Record<Intl.UnicodeBCP47LocaleIdentifier, FluentResource>;

type Resources = typeof RESOURCES;
export type AvailableLocale = keyof Resources;

export const AVAILABLE_LOCALES = Object.keys(RESOURCES) as AvailableLocale[];
const BUNDLES: Partial<Record<keyof Resources, FluentBundle>> = {};

export const negotiateLanguages = (userLocales: readonly string[]) =>
	fluentNegotiateLanguages(userLocales, AVAILABLE_LOCALES, {
		defaultLocale: DEFAULT_LOCALE,
	}) as AvailableLocale[];

// A generator function responsible for building the sequence
// of FluentBundle instances in the order of user's language
// preferences.
export function* generateBundlesFromNegotiated(currentLocales: readonly AvailableLocale[]) {
	for (const locale of currentLocales) {
		let bundle = BUNDLES[locale];

		if (!bundle) {
			const b = new FluentBundle(locale);
			b.addResource(RESOURCES[locale]);
			bundle = BUNDLES[locale] = b;
		}

		yield bundle;
	}
}

// A generator function responsible for building the sequence
// of FluentBundle instances in the order of user's language
// preferences.
export function* generateBundles(userLocales: readonly string[]) {
	yield* generateBundlesFromNegotiated(negotiateLanguages(userLocales));
}
