import fs from 'node:fs/promises';
import path from 'node:path';
import { FIREFOX_ADDON_CHANNELS } from '@coub-addons/publish-extension';
import {
	type ImportMetaEnvAugmented,
	Schema,
	defineConfig as defineEnvConfig,
	loadAndValidateEnv,
} from '@julr/vite-plugin-validate-env';

import commonEnv from '../../env';
import { name, version } from '../../package.json' with { type: 'json' };
import { OUTPUT_DIR } from './init-common';

const extZipPath = path.join(OUTPUT_DIR, `${name}-${version}-firefox.zip`),
	sourcesZipPath = path.join(OUTPUT_DIR, `${name}-${version}-sources.zip`);

await Promise.all([
	fs.access(extZipPath, fs.constants.R_OK),
	fs.access(sourcesZipPath, fs.constants.R_OK),
]);

const env = defineEnvConfig({
	...commonEnv,
	FIREFOX_TEST_EXTENSION_ID: Schema.string.optional(),
	FIREFOX_CHANNEL: Schema.enum(FIREFOX_ADDON_CHANNELS),
	FIREFOX_JWT_ISSUER: Schema.string(),
	FIREFOX_JWT_SECRET: Schema.string(),
});

await loadAndValidateEnv(
	{
		envDir: false,
		mode: 'production',
		envPrefix: ['VITE_', 'FIREFOX_'],
	},
	env,
);

const {
	VITE_GECKO_ID: extensionId,
	FIREFOX_TEST_EXTENSION_ID: testExtensionId,
	FIREFOX_CHANNEL: channel,
	FIREFOX_JWT_ISSUER: jwtIssuer,
	FIREFOX_JWT_SECRET: jwtSecret,
} = process.env as ImportMetaEnvAugmented<typeof env>;

export { channel, extZipPath, extensionId, jwtIssuer, jwtSecret, sourcesZipPath, testExtensionId };
