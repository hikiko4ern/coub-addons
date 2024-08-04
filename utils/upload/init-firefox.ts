import fs from 'node:fs/promises';
import path from 'node:path';
import { FirefoxAddonChannel } from '@coub-addons/publish-extension';
import { config } from 'dotenv-flow';
import { assert, optional, string, type } from 'superstruct';

import { name, version } from '../../package.json' with { type: 'json' };
import { OUTPUT_DIR } from './init-common';

const extZipPath = path.join(OUTPUT_DIR, `${name}-${version}-firefox.zip`),
	sourcesZipPath = path.join(OUTPUT_DIR, `${name}-${version}-sources.zip`);

await Promise.all([fs.lstat(extZipPath), fs.lstat(sourcesZipPath)]);

const Env = type({
	FIREFOX_EXTENSION_ID: string(),
	FIREFOX_TEST_EXTENSION_ID: optional(string()),
	FIREFOX_CHANNEL: FirefoxAddonChannel,
	FIREFOX_JWT_ISSUER: string(),
	FIREFOX_JWT_SECRET: string(),
});

const envResult = config({ node_env: 'submit' });

if (envResult.error) {
	throw envResult.error;
}

const env = envResult.parsed;

assert(env, Env);

const {
	FIREFOX_EXTENSION_ID: extensionId,
	FIREFOX_TEST_EXTENSION_ID: testExtensionId,
	FIREFOX_CHANNEL: channel,
	FIREFOX_JWT_ISSUER: jwtIssuer,
	FIREFOX_JWT_SECRET: jwtSecret,
} = env;

export { channel, extensionId, testExtensionId, jwtIssuer, jwtSecret, extZipPath, sourcesZipPath };
