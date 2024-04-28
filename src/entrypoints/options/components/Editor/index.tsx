import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { LanguageSupport, bracketMatching } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Annotation, EditorState, type Extension, StateEffect } from '@codemirror/state';
import { EditorView, dropCursor, keymap, lineNumbers } from '@codemirror/view';
import type { Signal } from '@preact/signals';
import { aura } from '@uiw/codemirror-theme-aura';
import cx from 'clsx';
import type { FunctionComponent, Ref } from 'preact';
import {
	useContext,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'preact/hooks';
import { tomorrow } from 'thememirror';

import { truthyFilter } from '@/helpers/truthyFilter';
import { SettingsContext } from '@/options/components/SettingsProvider/context';
import { Theme } from '@/storage/settings/types';

import styles from './styles.module.scss';

interface Props {
	stateRef?: Ref<Editor.Ref>;
	className?: string;
	defaultValue: string;
	language?: LanguageSupport;
	linter?: Extension;
	foldable?: boolean;
	readOnly?: boolean;
	lineWrapping?: boolean;
	isModifiedSignal?: Signal<boolean>;
	save: (value: string) => void;
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
	linter,
	readOnly = false,
	lineWrapping,
	isModifiedSignal,
	save,
}) => {
	const { theme } = useContext(SettingsContext);
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
							const isModified = value !== initialValueRef.current;

							if (isModified !== isModifiedRef.current) {
								isModifiedRef.current = isModified;
								isModifiedSignal.value = isModified;
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
					{
						key: 'Mod-s',
						run: view => (save(view.state.doc.toString()), true),
						preventDefault: true,
					},
				]),
				// theme
				theme === Theme.DARK ? aura : tomorrow,
				// languages
				language,
				linter,
			].filter(truthyFilter),
		[language, linter, readOnly, lineWrapping, theme, save],
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
			const value = view?.state.doc.toString();
			const isModified = value !== defaultValue;

			initialValueRef.current = defaultValue;
			isModifiedRef.current = isModified;
			isModifiedSignal && (isModifiedSignal.value = isModified);
		}
	}, [view, defaultValue]);

	return (
		<div
			ref={container}
			className={cx(className, styles.editor, styles[`editor_theme_${theme as 'dark'}`])}
		/>
	);
};
