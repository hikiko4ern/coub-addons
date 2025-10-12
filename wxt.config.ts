import 'dotenv-flow/config';

import type {} from '@coub-addons/wxt-svg-icon';
import { ValidateEnv } from '@julr/vite-plugin-validate-env';
import { lezer } from '@lezer/generator/rollup';
import preact from '@preact/preset-vite';
import { normalizePath } from 'vite';
import sassDts from 'vite-plugin-sass-dts';
import { type UserManifest, type WxtViteConfig, defineConfig } from 'wxt';

import {
	ARE_COMMENTS_ON_DIFFERENT_HOST,
	COMMENTS_GRAPHQL_HOST,
	COUB_HOST,
} from './src/permissions/constants';

export const geckoManifest = {
	id: process.env.VITE_GECKO_ID,
	update_url: process.env.VITE_GECKO_UPDATE_URL,
	strict_min_version: '125',
} satisfies NonNullable<UserManifest['browser_specific_settings']>['gecko'];

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@coub-addons/wxt-svg-icon'],
	srcDir: 'src',
	alias: {
		// libs
		react: 'node_modules/preact/compat',
		'react-dom': 'node_modules/preact/compat',
		// internal
		'@/options': 'src/entrypoints/options',
	},
	manifest: env => ({
		name: '__MSG_extName__',
		description: '__MSG_extDescription__',
		default_locale: 'en',
		permissions: [
			'storage',
			'unlimitedStorage',
			'webRequest',
			'webRequestBlocking',
			'webRequestFilterResponse',
			'menus',
		],
		host_permissions: [COUB_HOST],
		...(ARE_COMMENTS_ON_DIFFERENT_HOST && {
			[env.manifestVersion === 3 ? 'optional_host_permissions' : 'optional_permissions']: [
				COMMENTS_GRAPHQL_HOST,
			],
		}),
		browser_action: {},
		browser_specific_settings: {
			gecko: geckoManifest,
		},
		content_security_policy: {
			// don't forget to reload the extension after changing the hash
			extension_pages:
				"script-src 'self' 'sha256-+Xz1iA/3wvRwOUFS+SCA6HgYZn06cVcRqCDRJA8IpO8='; object-src 'self'",
		},
	}),
	zip: {
		includeSources: ['.env', '.env.production', '.npmrc', '.nvmrc', '.postcssrc.json'],
		excludeSources: [
			'src/gql/comments/requests/**',
			'src/gql/comments/schema.json',
			'docs/**',
			'test/**',
			'test-extension/**',
			'utils/**',
			'blockedChannels*.json',
			'biome.json',
			'cliff.toml',
			'cspell.json',
			'dprint.json',
			'lefthook.yml',
			'vitest.config.ts',
			'*.zip',
			'packages/publish-extension/**',
		],
	},
	hooks: {
		'build:manifestGenerated'(wxt, manifest) {
			// biome-ignore lint/style/noNonNullAssertion: `options_ui` is always presented since we have an `options` entrypoint
			manifest.options_ui!.open_in_tab = true;

			if (wxt.config.browser !== 'firefox') {
				delete manifest.browser_specific_settings;
			}
		},
	},
	runner: {
		disabled: true,
	},
	vite: () =>
		({
			build: {
				target: [
					'es2023', // lightningcss doesn't support `es2024` yet
					'firefox125',
				],
				cssMinify: 'lightningcss',
			},

			css: {
				lightningcss: {
					targets: {
						firefox: 125 << 16,
					},
				},
				preprocessorOptions: {
					scss: {
						api: 'modern-compiler',
					},
				},
			},

			plugins: [
				ValidateEnv(),
				preact({ devToolsEnabled: false }),
				sassDts(),
				lezer(),
				(() => {
					const emptyFileName = '\0coub-addons__exclude';
					const reactAriaIntlStringsRe = /\/@react-aria\/[^/]+\/dist\/intlStrings\./;
					const reactAriaIntlModuleRe = /[a-z]{2,}-[a-z]{2,}\./i;
					const reactAriaLocalesToKeepRe = /(ru-RU|en-US)/;

					return {
						enforce: 'pre',
						resolveId(source, importer) {
							let normalizedSource: string;

							if (
								source === emptyFileName ||
								(importer &&
									reactAriaIntlStringsRe.test(normalizePath(importer)) &&
									reactAriaIntlModuleRe.test((normalizedSource = normalizePath(source))) &&
									!reactAriaLocalesToKeepRe.test(normalizedSource))
							) {
								return emptyFileName;
							}

							return null;
						},
						load(id) {
							return id === emptyFileName ? 'export default {}' : null;
						},
					} as const;
				})(),
			],
		}) satisfies WxtViteConfig,
});
