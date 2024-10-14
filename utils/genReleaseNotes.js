/**
 * @file generates release notes for git hosting
 *
 * Usage:
 *
 * 1. generate for the latest version:
 * 		node ./utils/genReleaseNotes.js
 *
 * 2. generate for a specific version:
 * 		node ./utils/genReleaseNotes.js -v 0.1.26
 *
 * 3. generate for a specific version with a custom range:
 * 		node ./utils/genReleaseNotes.js -v 0.1.26 --range v0.1.25..v0.1.26
 */

// @ts-check

import { stdout } from 'node:process';
import { parseArgs } from 'node:util';
import { codeToANSI } from '@shikijs/cli';
import { execa } from 'execa';
import { runGitCliff } from 'git-cliff';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';
import { remove } from 'unist-util-remove';
import { SKIP, visit } from 'unist-util-visit';

import pkg from '../package.json' with { type: 'json' };

let {
	values: { version, range, files: withFilesFooter },
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
		files: {
			type: 'boolean',
			short: 'F',
			default: true,
		},
	},
	allowNegative: true,
});

if (!version) {
	throw new RangeError(`\`--version\` is required, got \`${JSON.stringify(version)}\``);
}

if (!range) {
	const prevTag = (
		await execa({
			stdio: ['ignore', 'pipe', 'inherit'],
		})`git describe --tags --abbrev=0 v${version}^`
	).stdout.trim();

	if (!prevTag) {
		throw new Error(`Failed to get previous for ${version} version`);
	}

	range = `${prevTag}..v${version}`;
}

const compareLink = `https://github.com/hikiko4ern/coub-addons/compare/${range.replace('..', '...')}`;

const newVersionMarkdown = (await runGitCliff([range], { stdio: ['ignore', 'pipe', 'inherit'] }))
	.stdout;

const mdTree = fromMarkdown(newVersionMarkdown);

remove(mdTree, [
	{ type: 'heading', depth: 1 },
	{ type: 'heading', depth: 2 },
]);

// replace issue/PR links `[#1](https://github.com/hikiko4ern/coub-addons/issues/1)`
// with a plain text `#1`
{
	const ISSUE_PR_NUMBER_RE = /^\/hikiko4ern\/coub-addons\/(?:issues|pull)\/(\d+)$/;

	visit(mdTree, 'link', (node, i, parent) => {
		if (typeof i === 'number' && Array.isArray(parent?.children)) {
			const url = new URL(node.url);
			const issueNumber = url.pathname.match(ISSUE_PR_NUMBER_RE)?.[1];

			if (issueNumber) {
				parent.children[i] = { type: 'text', value: `#${issueNumber}` };
				return SKIP;
			}
		}
	});
}

mdTree.children.push({
	type: 'paragraph',
	children: [
		{ type: 'strong', children: [{ type: 'text', value: 'Full Changelog' }] },
		{ type: 'text', value: ': ' },
		{ type: 'link', url: compareLink, children: [{ type: 'text', value: compareLink }] },
	],
});

if (withFilesFooter) {
	mdTree.children.push(
		{ type: 'thematicBreak' },
		...releaseFiles({
			title: 'What files are in the release?',
			fileHeader: 'file',
			descriptionHeader: 'description',
			xpiDescription: [{ type: 'text', value: 'signed extension for Firefox' }],
			sourcesDescription: [
				{
					type: 'text',
					value: 'the source code from which the Firefox extension was built',
				},
				{ type: 'html', value: '<br/>' },
				{
					type: 'text',
					value: '(which can be used, for example, for reproducible builds)',
				},
			],
		}),
		...releaseFiles({
			title: 'Какие файлы есть в релизе?',
			fileHeader: 'файл',
			descriptionHeader: 'описание',
			xpiDescription: [{ type: 'text', value: 'подписанное расширение для Firefox' }],
			sourcesDescription: [
				{
					type: 'text',
					value: 'исходный код, из которого было собрано расширение для Firefox',
				},
				{ type: 'html', value: '<br/>' },
				{
					type: 'text',
					value: '(который можно использовать, например, для воспроизводимых сборок)',
				},
			],
		}),
	);
}

const releaseNotes = toMarkdown(mdTree, {
	bullet: '-',
	rule: '-',
	extensions: [gfmToMarkdown({ tablePipeAlign: false })],
}).trim();

stdout.isTTY && console.log();
console.log(
	stdout.isTTY ? (await codeToANSI(releaseNotes, 'markdown', 'ayu-dark')).trim() : releaseNotes,
);

/**
 * @typedef {Object} ReleaseFilesOptions
 * @property {string} title
 * @property {string} fileHeader
 * @property {string} descriptionHeader
 * @property {import('mdast').PhrasingContent[]} xpiDescription
 * @property {import('mdast').PhrasingContent[]} sourcesDescription
 *
 * @param {ReleaseFilesOptions} options
 * @returns {import('mdast').RootContent[]}
 */
function releaseFiles({
	title,
	fileHeader,
	descriptionHeader,
	xpiDescription,
	sourcesDescription,
}) {
	return [
		{ type: 'html', value: `<details><summary>${title}</summary>` },
		{
			type: 'table',
			children: [
				{
					type: 'tableRow',
					children: [
						{ type: 'tableCell', children: [{ type: 'text', value: fileHeader }] },
						{ type: 'tableCell', children: [{ type: 'text', value: descriptionHeader }] },
					],
				},
				{
					type: 'tableRow',
					children: [
						{
							type: 'tableCell',
							children: [{ type: 'inlineCode', value: 'coub-addons-x.x.x-firefox.xpi' }],
						},
						{ type: 'tableCell', children: xpiDescription },
					],
				},
				{
					type: 'tableRow',
					children: [
						{
							type: 'tableCell',
							children: [{ type: 'inlineCode', value: 'coub-addons-x.x.x-sources.zip' }],
						},
						{ type: 'tableCell', children: sourcesDescription },
					],
				},
			],
		},
		{ type: 'html', value: '</details>' },
	];
}
