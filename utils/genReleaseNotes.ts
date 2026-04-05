/**
 * @file generates release notes for the git hosting
 *
 * Usage:
 *
 * 1. generate for the latest version:
 *      pnpm -s release-notes
 *
 * 2. generate for a specific version:
 *      pnpm -s release-notes -v 0.1.26
 *
 * 3. generate for a specific version with a custom range:
 *      pnpm -s release-notes -v 0.1.26 --range v0.1.25..v0.1.26
 */

import { parseArgs } from 'node:util';
import type { PhrasingContent, RootContent } from 'mdast';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';
import { SKIP, visit } from 'unist-util-visit';

import { generateReleaseNotes, releaseNotesArgs } from './helpers/generateReleaseNotes';
import { printCode } from './helpers/printCode';

const {
	values: { files: withFilesFooter },
} = parseArgs({
	options: {
		...releaseNotesArgs,
		files: {
			type: 'boolean',
			short: 'F',
			default: true,
		},
	},
	allowNegative: true,
});

const { mdTree, range } = await generateReleaseNotes();

// replace issue/PR links `[#1](https://codeberg.org/hikiko4ern/coub-addons/issues/1)`
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

const compareLink = `https://codeberg.org/hikiko4ern/coub-addons/compare/${range.replace('..', '...')}`;

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

await printCode(releaseNotes, 'markdown');

interface ReleaseFilesOptions {
	title: string;
	fileHeader: string;
	descriptionHeader: string;
	xpiDescription: PhrasingContent[];
	sourcesDescription: PhrasingContent[];
}

function releaseFiles({
	title,
	fileHeader,
	descriptionHeader,
	xpiDescription,
	sourcesDescription,
}: ReleaseFilesOptions): RootContent[] {
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
