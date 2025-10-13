/**
 * @file generates addon's description for AMO
 *
 * Usage:
 *
 * pnpm -s tsx ./utils/genAmoDescription.ts README.md
 */

import fs from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { generateExtensionDescription } from './helpers/generateExtensionDescription';
import { printCode } from './helpers/printCode';

const { positionals } = parseArgs({
	allowPositionals: true,
});

if (positionals.length < 1 || positionals.length > 1) {
	throw new RangeError('exactly one positional is required');
}

const description = generateExtensionDescription(
	await fs.readFile(positionals[0], { encoding: 'utf8' }),
);

await printCode(description, 'markdown');
