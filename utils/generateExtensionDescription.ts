/** @file generates addon's description for AMO */

import type { Element, ElementContent, Nodes as HastNodes, Root, RootContent, Text } from 'hast';
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
			nodes.flatMap(node => {
				const el = toHast(node);
				const trimLfFor = new Set<Root | Element>();
				let isMinify = true;

				visit(el, { type: 'element', tagName: 'p' }, (node, index, parent) => {
					if (parent && typeof index === 'number') {
						isMinify = false;
						trimLfFor.add(parent);
						parent.children.splice(index, 1, ...node.children, lf());
						return [SKIP, index + node.children.length + 1];
					}
				});

				for (const node of trimLfFor) {
					trimLf(node);
				}

				const tree = el.type === 'element' && el.tagName === 'p' ? [...el.children, lf2()] : el;
				isMinify && el.type === 'element' && minifyHtml(tree as never); // minifier is fine with `Element`s
				return tree;
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

	return toHtml(h(null, Array.from(joinSections(descriptionSections.values(), lf2()))));
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

function lf(): Text {
	return { type: 'text', value: '\n' };
}

function lf2(): Text {
	return { type: 'text', value: '\n\n' };
}

function trimLf(node: Root | Element) {
	const firstNonLf = node.children.findIndex(node => !isLf(node));

	if (firstNonLf === -1) {
		node.children = [];
		return;
	}

	const lastNonLf = node.children.findLastIndex(node => !isLf(node));

	if (firstNonLf !== 0 || lastNonLf !== node.children.length - 1) {
		node.children = node.children.slice(firstNonLf, lastNonLf + 1);
	}
}

function isLf(node: RootContent | ElementContent) {
	return node.type === 'text' && node.value === '\n';
}
