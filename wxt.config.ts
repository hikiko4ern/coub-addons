import 'dotenv-flow/config';

import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import type {} from '@coub-addons/wxt-svg-icon';
import { ValidateEnv } from '@julr/vite-plugin-validate-env';
import { lezer } from '@lezer/generator/rollup';
import preact from '@preact/preset-vite';
import { normalizePath } from 'vite';
import sassDts from 'vite-plugin-sass-dts';
import { type WxtViteConfig, defineConfig } from 'wxt';

import { COMMENTS_GRAPHQL_HOST } from './src/permissions/constants';

const SEGMENTER_UTILS_ASSET = 'segmenter-utils.wasm';

declare module 'wxt/browser' {
	export interface WxtRuntime {
		getURL(path: typeof SEGMENTER_UTILS_ASSET): string;
	}
}

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
	manifest: {
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
			`${process.env.VITE_COUB_ORIGIN}/*`,
		],
		optional_permissions: [COMMENTS_GRAPHQL_HOST],
		browser_action: {},
		browser_specific_settings: {
			gecko: {
				id: process.env.VITE_GECKO_ID,
				update_url: process.env.VITE_GECKO_UPDATE_URL,
				strict_min_version: '101.0',
			},
		},
		// don't forget to reload the extension after changing the hash!
		content_security_policy:
			"script-src 'self' 'wasm-unsafe-eval' 'sha256-tommjNcTFgpLYmOWXGx1CR0O2Eh5jNbwvUsWT6+GO4Q='; object-src 'self'",
	},
	zip: {
		includeSources: [
			'.env',
			'.env.production',
			'.npmrc',
			'.nvmrc',
			'.postcssrc.json',
			'packages/segmenter-utils/.task/checksum/build',
		],
		excludeSources: [
			'src/gql/comments/requests/**',
			'src/gql/comments/schema.json',
			'docs/**',
			'target/**',
			'test/**',
			'test-extension/**',
			'utils/**',
			'biome.json',
			'cliff.toml',
			'cspell.json',
			'dprint.json',
			'lefthook.yml',
			'Taskfile.yml',
			'vitest.config.ts',
			'*.zip',
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
		async 'build:done'(wxt) {
			await copyFile(
				require.resolve('@coub-addons/segmenter-utils/wasm'),
				path.resolve(wxt.config.outDir, SEGMENTER_UTILS_ASSET),
			);
		},
	},
	vite: () =>
		({
			build: {
				target: ['es2022', 'firefox101'],
				cssMinify: 'lightningcss',
			},

			css: {
				lightningcss: {
					targets: {
						firefox: 101 << 16,
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
