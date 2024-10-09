/**
 * @file adds the new version to the `updates.json`
 *
 * Usage:
 *
 * 1. add the current version:
 * 		pnpm add-update --file /path/to/coub-addons-0.1.26-firefox.xpi
 *
 * 2. add a specific version:
 * 		pnpm add-update --version 0.1.26 --file /path/to/coub-addons-0.1.26-firefox.xpi
 */

// @ts-check

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buffer } from 'node:stream/consumers';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { codeToANSI } from '@shikijs/cli';
import { execa } from 'execa';

import updates from '../docs/updates.json' with { type: 'json' };
import pkg from '../package.json' with { type: 'json' };

const ROOT_PATH = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const UPDATES_FILE = path.join(ROOT_PATH, 'docs', 'updates.json');

const {
	values: { version, file },
} = parseArgs({
	options: {
		version: {
			type: 'string',
			short: 'v',
			default: pkg.version,
		},
		file: {
			type: 'string',
			short: 'f',
		},
	},
});

if (!version) {
	throw new RangeError(`\`--version\` is required, got \`${JSON.stringify(version)}\``);
}

if (!file) {
	throw new RangeError(`path to the XPI \`--file\` is required, got \`${JSON.stringify(file)}\``);
}

/** @type {string} */
let newUpdateHash;

try {
	newUpdateHash = (await buffer(createReadStream(file).pipe(createHash('sha256')))).toString('hex');
} catch (err) {
	console.error('Failed to hash', file, err);
	process.exit(1);
}

/**
 * @typedef {Object} Update
 * @property {string} version
 * @property {string} update_link
 * @property {string} update_info_url
 * @property {string} update_hash
 */

/** @type {Update} */
const newUpdate = {
	version,
	update_link: `https://github.com/hikiko4ern/coub-addons/releases/download/v${version}/coub-addons-${version}-firefox.xpi`,
	update_info_url: `https://coub-addons.doggo.moe/release-notes/${version}.html`,
	update_hash: `sha256:${newUpdateHash}`,
};

const oldExtUpdates =
	updates.addons[/** @type {keyof typeof updates.addons} */ (process.env.VITE_GECKO_ID)];
const sameVersionOldUpdate = oldExtUpdates.updates.findIndex(u => u.version === version);

/** @type {typeof updates} */
const newUpdates = {
	...updates,
	addons: {
		...updates.addons,
		[process.env.VITE_GECKO_ID]: {
			...oldExtUpdates,
			updates: oldExtUpdates.updates.toSpliced(
				sameVersionOldUpdate,
				sameVersionOldUpdate === -1 ? 0 : 1,
				newUpdate,
			),
		},
	},
};

console.log('Writing to', path.relative(ROOT_PATH, UPDATES_FILE));
console.log();

if (sameVersionOldUpdate !== -1) {
	console.warn(
		'Replacing old update',
		await codeToANSI(
			JSON.stringify(oldExtUpdates.updates[sameVersionOldUpdate], null, 2),
			'json',
			'ayu-dark',
		),
	);
	console.log();
}

console.log('New update:');
console.log(await codeToANSI(JSON.stringify(newUpdate, null, 2), 'json', 'ayu-dark'));

await fs.writeFile(UPDATES_FILE, JSON.stringify(newUpdates, null, 2), { encoding: 'utf8' });

await execa({
	stdout: 'inherit',
	stderr: 'inherit',
})`pnpm dprint fmt ${UPDATES_FILE}`;
