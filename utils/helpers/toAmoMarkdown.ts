import type { Root } from 'mdast';
import { defaultHandlers, toMarkdown } from 'mdast-util-to-markdown';

/** serialize Markdown with AMO-specific style */
export const toAmoMarkdown = (tree: Root) =>
	toMarkdown(tree, {
		bullet: '-',
		bulletOther: '*',
		listItemIndent: 'mixed',
		handlers: {
			/**
			 * nested lists must be indented by 4 spaces, otherwise they will be rendered as a flat list:
			 * ```md
			 * - a
			 * - b
			 *   - c
			 *   - d
			 * ```
			 * will be rendered as
			 * ```md
			 * - a
			 * - b
			 * - c
			 * - d
			 * ```
			 * but with a 4-space indent
			 * ```md
			 * - a
			 * - b
			 *     - c
			 *     - d
			 * ```
			 * the list will be rendered correctly
			 *
			 * @see https://github.com/mozilla/addons/issues/15425
			 */
			listItem: function listItem(node, parent, state, info) {
				if (
					// don't handle 1st list level
					state.stack.length < 2 ||
					// don't handle mixed-indent lists
					(state.options.listItemIndent === 'mixed' && parent?.type === 'list' && parent.spread)
				) {
					return defaultHandlers.listItem(node, parent, state, info);
				}

				const prevBullet = state.bulletCurrent;
				state.bulletCurrent = '  ' + state.bulletCurrent;

				const str = defaultHandlers.listItem(node, parent, state, info);

				state.bulletCurrent = prevBullet;
				return str;
			},
		},
	}).trim();
