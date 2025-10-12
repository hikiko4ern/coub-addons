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
 * 		pnpm add-update --version 0.1.26 --sha256 sha256_hash
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
import { geckoManifest } from '../wxt.config';

const ROOT_PATH = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const UPDATES_FILE = path.join(ROOT_PATH, 'docs', 'updates.json');

const {
	values: { version: argsVersion, file, sha256 },
} = parseArgs({
	options: {
		version: {
			type: 'string',
			short: 'v',
		},
		file: {
			type: 'string',
			short: 'f',
		},
		sha256: {
			type: 'string',
		},
	},
});

const version = argsVersion || pkg.version;

if (!version) {
	throw new RangeError(`\`--version\` is required, got \`${JSON.stringify(version)}\``);
}

let newUpdateHash: string;

if (sha256) {
	if (!argsVersion) {
		throw new Error('`--sha256` can only be used with `--version`');
	}

	newUpdateHash = sha256;
} else {
	if (!file) {
		throw new RangeError(`path to the XPI \`--file\` is required, got \`${JSON.stringify(file)}\``);
	}

	try {
		newUpdateHash = (await buffer(createReadStream(file).pipe(createHash('sha256')))).toString(
			'hex',
		);
	} catch (err) {
		console.error('Failed to hash', file, err);
		process.exit(1);
	}
}

interface Update {
	version: string;
	update_link: string;
	update_info_url: string;
	update_hash: string;
	applications: {
		gecko: {
			strict_min_version: string;
		};
	};
}

const newUpdate: Update = {
	version,
	update_link: `https://github.com/hikiko4ern/coub-addons/releases/download/v${version}/coub-addons-${version}-firefox.xpi`,
	update_info_url: `https://coub-addons.doggo.moe/release-notes/${version}.html`,
	update_hash: `sha256:${newUpdateHash}`,
	applications: {
		gecko: {
			strict_min_version: geckoManifest.strict_min_version,
		},
	},
};

const oldExtUpdates = updates.addons[process.env.VITE_GECKO_ID as keyof typeof updates.addons];
const sameVersionOldUpdate = oldExtUpdates.updates.findIndex(u => u.version === version);

const newUpdates: typeof updates = {
	...updates,
	addons: {
		...updates.addons,
		[process.env.VITE_GECKO_ID]: {
			...oldExtUpdates,
			updates: oldExtUpdates.updates.toSpliced(
				sameVersionOldUpdate === -1 ? oldExtUpdates.updates.length : sameVersionOldUpdate,
				sameVersionOldUpdate === -1 ? 0 : 1,
				newUpdate,
			),
		},
	},
};

console.log('Writing to', path.relative(ROOT_PATH, UPDATES_FILE));
console.log();

if (sameVersionOldUpdate !== -1) {
	console.warn('Replacing old update');
	console.warn(
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
