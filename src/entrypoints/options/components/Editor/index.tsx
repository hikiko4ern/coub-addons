import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { LanguageSupport, bracketMatching } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Annotation, EditorState, StateEffect } from '@codemirror/state';
import { EditorView, dropCursor, keymap, lineNumbers } from '@codemirror/view';
import { aura } from '@ddietr/codemirror-themes/aura';
import type { Signal } from '@preact/signals';
import cx from 'clsx';
import type { FunctionComponent, Ref } from 'preact';
import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'preact/hooks';

import { truthyFilter } from '@/helpers/truthyFilter';

import styles from './styles.module.scss';

interface Props {
	stateRef?: Ref<Editor.Ref>;
	className?: string;
	defaultValue: string;
	language?: LanguageSupport;
	foldable?: boolean;
	readOnly?: boolean;
	lineWrapping?: boolean;
	isModifiedSignal?: Signal<boolean>;
}

const External = Annotation.define<boolean>();

export namespace Editor {
	export type OnChange = (value: string) => void;

	export interface Ref {
		getValue: () => string | undefined;
		setValue: (value: string) => void;
	}
}

export const Editor: FunctionComponent<Props> = ({
	stateRef,
	className,
	defaultValue,
	language,
	readOnly = false,
	lineWrapping,
	isModifiedSignal,
}) => {
	const container = useRef<HTMLDivElement>(null);
	const initialValueRef = useRef(defaultValue);
	const isModifiedRef = useRef(false);

	const extensions = useMemo(
		() =>
			[
				// view
				lineWrapping && EditorView.lineWrapping,
				lineNumbers(),
				dropCursor(),
				EditorState.readOnly.of(readOnly),
				isModifiedSignal &&
					EditorView.updateListener.of(update => {
						if (
							update.docChanged &&
							// Fix echoing of the remote changes:
							// If transaction is market as remote we don't have to call `onChange` handler again
							!update.transactions.some(tr => tr.annotation(External))
						) {
							const value = update.state.doc.toString();

							if (isModifiedSignal) {
								const isModified = value !== initialValueRef.current;

								if (isModified !== isModifiedRef.current) {
									isModifiedRef.current = isModified;
									isModifiedSignal.value = isModified;
								}
							}
						}
					}),
				// editor
				history(),
				bracketMatching(),
				closeBrackets(),
				highlightSelectionMatches(),
				keymap.of([
					...closeBracketsKeymap,
					...defaultKeymap,
					...searchKeymap,
					...historyKeymap.map(km =>
						km.key === 'Mod-y'
							? {
									...km,
									key: 'Ctrl-Shift-z',
								}
							: km,
					),
				]),
				// theme
				aura,
				// languages
				language,
			].filter(truthyFilter),
		[language, readOnly, lineWrapping],
	);

	const state = useMemo(
		() =>
			EditorState.create({
				doc: defaultValue,
				extensions,
			}),
		[],
	);

	const [view, setView] = useState<EditorView>();

	useEffect(() => {
		view?.dispatch({
			effects: StateEffect.reconfigure.of(extensions),
		});
	}, [view, extensions]);

	useImperativeHandle(
		stateRef as Ref<Editor.Ref>,
		(): Editor.Ref => ({
			getValue: () => (view ? view.state.doc.toString() : undefined),
			setValue: (value: string) => {
				view?.dispatch({
					changes: {
						from: 0,
						to: view.state.doc.toString().length,
						insert: value,
					},
				});
			},
		}),
		[view],
	);

	useEffect(() => {
		if (container.current) {
			!view &&
				setView(
					new EditorView({
						parent: container.current,
						state,
					}),
				);
		}
	}, [container.current, state]);

	useEffect(() => {
		if (defaultValue !== initialValueRef.current) {
			initialValueRef.current = defaultValue;
			isModifiedRef.current = false;
			isModifiedSignal && (isModifiedSignal.value = false);
		}
	}, [defaultValue]);

	return <div ref={container} className={cx(className, styles.editor)} />;
};
