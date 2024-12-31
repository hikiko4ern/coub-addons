import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';

export const highlightLineEffect = StateEffect.define<number | undefined>();

export const highlightLineField = StateField.define({
	create() {
		return Decoration.none;
	},
	update(lines, tr) {
		lines = lines.map(tr.changes);

		for (const e of tr.effects) {
			if (e.is(highlightLineEffect)) {
				lines = Decoration.none;

				if (typeof e.value === 'number') {
					lines = lines.update({ add: [highlightedLineDecoration.range(e.value)] });
				}
			}
		}

		return lines;
	},
	provide: field => EditorView.decorations.from(field),
});

const highlightedLineDecoration = Decoration.line({
	attributes: {
		class: 'bg-warning-100',
	},
});
