/** @file generates addon's description for AMO */

// @ts-check

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeToANSI } from '@shikijs/cli';
import { toHtml } from 'hast-util-to-html';
import { h } from 'hastscript';
import { commentMarker } from 'mdast-comment-marker';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { toHast } from 'mdast-util-to-hast';
import { zone } from 'mdast-zone';
import { gfm } from 'micromark-extension-gfm';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import { SKIP, visit } from 'unist-util-visit';

const ROOT_PATH = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/**
 * @typedef {'en' | 'ru'} SupportedLocale
 * @type {{ [locale in SupportedLocale]: locale extends 'en' ? 'README.md' : `README.${locale}.md` }}
 */
const README_FILE_NAMES = {
	en: 'README.md',
	ru: 'README.ru.md',
};

const minifyHtml = rehypeMinifyWhitespace();

/** @type {import('mdast-util-from-markdown').Options} */
const mdOptions = {
	extensions: [gfm()],
	mdastExtensions: [gfmFromMarkdown()],
};

for (const [lang, file] of Object.entries(README_FILE_NAMES)) {
	console.log(`----- [${lang}] -----\n`);

	const html = generateDescription(
		await fs.readFile(path.join(ROOT_PATH, file), { encoding: 'utf8' }),
	);

	console.log(await codeToANSI(html, 'html', 'ayu-dark'));
}

/** @param {string} content */
function generateDescription(content) {
	/** @typedef {import('hast').Nodes} Nodes */

	const readmeMdTree = fromMarkdown(content, mdOptions);

	/** @type {Nodes[][]} */
	const descriptionSections = [];

	zone(readmeMdTree, 'short-description', (_start, nodes, _end) => {
		descriptionSections.push(
			nodes.flatMap(node => {
				const el = toHast(node);
				return el.type === 'element' && el.tagName === 'p' ? el.children : el;
			}),
		);
	});

	zone(readmeMdTree, 'features', (_start, nodes, _end) => {
		for (const node of nodes) {
			visit(node, 'listItem', node => {
				const it = node.children.entries();
				let next = it.next();

				while (next.done === false) {
					const [, value] = next.value;

					if (commentMarker(value)?.name === 'shortcuts-table') {
						/** @type {[number, import('mdast').Table]} */
						const [i, table] = (next = it.next()).value;

						/** @type {import('mdast').List} */
						const shortcuts = {
							type: 'list',
							ordered: false,
							children: table.children.slice(1).map(
								/** @returns {import('mdast').ListItem} */
								row => ({
									type: 'listItem',
									children: /** @type {import('mdast').ListItem['children']} */ (
										row.children[0].children
									),
								}),
							),
						};

						node.children[i] = shortcuts;

						return SKIP;
					}

					next = it.next();
				}
			});
		}

		descriptionSections.push(
			nodes.map(node => {
				const el = toHast(node);
				el.type === 'element' &&
					minifyHtml(/** @type {any} minifier is fine with `Element`s */ (el));
				return el;
			}),
		);
	});

	zone(readmeMdTree, 'reload-warn', (_start, nodes, _end) => {
		descriptionSections.push(
			nodes.map(node => {
				const el = toHast(node);
				el.type === 'element' && el.tagName === 'p' && (el.tagName = 'strong');
				return el;
			}),
		);
	});

	const htmlTree = h(
		null,
		Array.from(joinSections(descriptionSections.values(), { type: 'text', value: '\n\n' })),
	);

	return toHtml(htmlTree);
}

/**
 * @template T
 * @param {IterableIterator<T[]>} iter
 * @param {NoInfer<T>} joiner
 */
function* joinSections(iter, joiner) {
	let next = iter.next();

	while (next.done === false) {
		yield* next.value;

		next = iter.next();

		if (next.done === false) {
			yield joiner;
		}
	}

	return next.value;
}
