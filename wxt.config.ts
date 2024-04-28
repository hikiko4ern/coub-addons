import 'dotenv-flow/config';

import arrayBuffer from '@coub-addons/vite-plugin-arraybuffer';
import { ValidateEnv } from '@julr/vite-plugin-validate-env';
import { lezer } from '@lezer/generator/rollup';
import preact from '@preact/preset-vite';
import sassDts from 'vite-plugin-sass-dts';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: 'src',
	alias: {
		// libs
		react: 'node_modules/preact/compat',
		'react-dom': 'node_modules/preact/compat',
		// internal
		'@/options': 'src/entrypoints/options',
	},
	manifest: {
		name: 'Coub addons',
		permissions: [
			'storage',
			'unlimitedStorage',
			'webRequest',
			'webRequestBlocking',
			'menus',
			`${process.env.VITE_COUB_ORIGIN}/*`,
		],
		browser_action: {},
		browser_specific_settings: {
			gecko: {
				id: process.env.VITE_GECKO_ID,
				strict_min_version: '101.0',
			},
		},
		// don't forget to reload the extension after changing the hash!
		content_security_policy:
			"script-src 'self' 'wasm-unsafe-eval' 'sha256-tommjNcTFgpLYmOWXGx1CR0O2Eh5jNbwvUsWT6+GO4Q='; object-src 'self'",
	},
	zip: {
		includeSources: ['.env'],
		excludeSources: ['target/**', 'test/**', 'utils/**'],
	},
	hooks: {
		'build:manifestGenerated'(_, manifest) {
			// biome-ignore lint/style/noNonNullAssertion: `options_ui` is always presented since we have an `options` entrypoint
			manifest.options_ui!.open_in_tab = true;
		},
	},
	vite: () => ({
		plugins: [ValidateEnv(), arrayBuffer(), preact({ devToolsEnabled: false }), sassDts(), lezer()],
		css: {
			lightningcss: {
				targets: {
					firefox: 101 << 16,
				},
			},
		},
		build: {
			target: ['es2022', 'firefox101'],
			cssMinify: 'lightningcss',
		},
	}),
});
