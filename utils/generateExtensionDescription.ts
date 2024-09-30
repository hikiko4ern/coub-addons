/** @file generates addon's description for AMO */

import type { Nodes as HastNodes } from 'hast';
import { toHtml } from 'hast-util-to-html';
import { h } from 'hastscript';
import type { List, ListItem } from 'mdast';
import { commentMarker } from 'mdast-comment-marker';
import {
	type Options as MdastUtilFromMarkdownOptions,
	fromMarkdown,
} from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { toHast } from 'mdast-util-to-hast';
import { zone } from 'mdast-zone';
import { gfm } from 'micromark-extension-gfm';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import { SKIP, visit } from 'unist-util-visit';

const minifyHtml = rehypeMinifyWhitespace();

const mdOptions: MdastUtilFromMarkdownOptions = {
	extensions: [gfm()],
	mdastExtensions: [gfmFromMarkdown()],
};

export function generateExtensionDescription(content: string) {
	const readmeMdTree = fromMarkdown(content, mdOptions);

	const descriptionSections: HastNodes[][] = [];

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
					const marker = commentMarker(value);

					if (marker?.name === 'shortcuts-table') {
						next = it.next();

						if (next.done || next.value[1].type !== 'table') {
							throw new Error(`expected table after ${JSON.stringify(marker)} marker`);
						}

						const [i, table] = next.value;

						const shortcuts: List = {
							type: 'list',
							ordered: false,
							children: table.children.slice(1).map(
								(row): ListItem => ({
									type: 'listItem',
									children: row.children[0].children as ListItem['children'],
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
				el.type === 'element' && minifyHtml(el as never); // minifier is fine with `Element`s
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

	return toHtml(
		h(
			null,
			Array.from(joinSections(descriptionSections.values(), { type: 'text', value: '\n\n' })),
		),
	);
}

function* joinSections<T>(iter: IterableIterator<T[]>, joiner: NoInfer<T>) {
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
