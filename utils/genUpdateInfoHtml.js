/**
 * @file generates release notes for auto-updates
 *
 * Usage:
 *
 * 1. generate changelog during bump:
 * 		node ./utils/genUpdateInfoHtml.js
 *
 * 2. generate changelog for a specific version:
 * 		node ./utils/genUpdateInfoHtml.js -v 0.1.26 --range v0.1.25..v0.1.26
 */

// @ts-check

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { codeToANSI } from '@shikijs/cli';
import { runGitCliff } from 'git-cliff';
import { toHtml } from 'hast-util-to-html';
import { h } from 'hastscript';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import { remove } from 'unist-util-remove';

import pkg from '../package.json' with { type: 'json' };

const ROOT_PATH = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const RELEASE_NOTES_DIR = path.join(ROOT_PATH, 'docs', 'release-notes');

const {
	values: { version, range },
} = parseArgs({
	options: {
		version: {
			type: 'string',
			short: 'v',
			default: pkg.version,
		},
		range: {
			type: 'string',
		},
	},
});

if (!version) {
	throw new RangeError(`\`--version\` is required, got \`${JSON.stringify(version)}\``);
}

const newVersionMarkdown = (
	await runGitCliff(range ? [range] : ['--unreleased'], {
		stdio: ['ignore', 'pipe', 'inherit'],
	})
).stdout;

const mdTree = fromMarkdown(newVersionMarkdown);

remove(mdTree, [
	{ type: 'heading', depth: 1 },
	{ type: 'heading', depth: 2 },
]);

const htmlTree = h(null, [
	{ type: 'doctype' },
	h('html', { lang: 'en' }, [
		h('head', [h('meta', { charSet: 'UTF-8' }), h('title', [`v${version} release notes`])]),
		h('body', toHast(mdTree)),
	]),
]);

rehypeMinifyWhitespace()(htmlTree);

const html = toHtml(htmlTree);

const htmlPath = path.join(RELEASE_NOTES_DIR, `${version}.html`);

console.log('Writing to', path.relative(ROOT_PATH, htmlPath));
console.log();
console.log(await codeToANSI(html, 'html', 'ayu-dark'));

await fs.mkdir(RELEASE_NOTES_DIR, { recursive: true });
await fs.writeFile(htmlPath, `${html}\n`, { encoding: 'utf8' });
