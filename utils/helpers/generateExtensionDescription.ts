import assert from 'node:assert';
import type { Html, List, ListItem, PhrasingContent, Root, RootContent, Text } from 'mdast';
import { commentMarker } from 'mdast-comment-marker';
import { type Options as FromMarkdownOptions, fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { zone } from 'mdast-zone';
import { gfm } from 'micromark-extension-gfm';
import { remove } from 'unist-util-remove';
import { SKIP, visit } from 'unist-util-visit';

import { toAmoMarkdown } from './toAmoMarkdown';

const mdOptions: FromMarkdownOptions = {
	extensions: [gfm()],
	mdastExtensions: [gfmFromMarkdown()],
};

/**
 * generates addon's description for AMO
 *
 * @param content content of the README.md
 */
export function generateExtensionDescription(content: string) {
	const readmeMdTree = fromMarkdown(content, mdOptions);

	const descriptionSections: RootContent[][] = [];

	zone(readmeMdTree, 'short-description', (_start, nodes, _end) => {
		descriptionSections.push(nodes as RootContent[]);
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
							spread: false,
							children: table.children.slice(1).map(
								(row): ListItem => ({
									type: 'listItem',
									children: [
										{
											type: 'paragraph',
											children: row.children[0].children,
										},
									],
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
			nodes.flatMap(node =>
				node.type === 'paragraph' ? [...node.children, lf2()] : node,
			) as RootContent[],
		);
	});

	zone(readmeMdTree, 'reload-warn', (_start, nodes, _end) => {
		descriptionSections.push([
			{
				type: 'strong',
				children: nodes as PhrasingContent[],
			},
		]);
	});

	const newTree: Root = {
		type: 'root',
		children: Array.from(joinSections(descriptionSections.values(), lf2())),
	};

	remove(newTree, node => node.type === 'html' && (node as Html).value.startsWith('<!--'));

	visit(newTree, 'html', (node, index, parent) => {
		if (parent && typeof index === 'number') {
			if (node.value === '<kbd>') {
				const next = parent.children[index + 1];
				assert(next.type === 'text', `node next to <kbd> must be text, got ${next.type}`);

				parent.children.splice(index, 3, {
					type: 'inlineCode',
					value: next.value,
				});
				return index;
			}
		}
	});

	return toAmoMarkdown(newTree);
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

function lf2(): Text {
	return { type: 'text', value: '\n\n' };
}
