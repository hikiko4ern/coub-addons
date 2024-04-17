import { LRLanguage, LanguageSupport, syntaxTree } from '@codemirror/language';
import { type Diagnostic, linter } from '@codemirror/lint';
import { styleTags, tags as t } from '@lezer/highlight';

import { tryRegexFromLine } from '@/storage/phrasesBlocklist/helpers/tryRegexFromLine';
import { parser } from './syntax.grammar';

export const phrasesBlocklistLanguage = LRLanguage.define({
	parser: parser.configure({
		props: [
			styleTags({
				RegExp: t.regexp,
			}),
		],
	}),
});

export const phrasesBlocklistLinter = linter(view => {
	const diagnostics: Diagnostic[] = [];

	syntaxTree(view.state)
		.cursor()
		.iterate(node => {
			if (node.name === 'Phrase' || node.name === 'RegExp') {
				let line = view.state.sliceDoc(node.from, node.to);
				line[line.length - 1] === '\n' && (line = line.slice(0, -1));

				try {
					tryRegexFromLine(line);
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);

					diagnostics.push({
						from: node.from,
						to: node.to,
						severity: 'error',
						message,
					});
				}
			}
		});

	return diagnostics;
});

export const phrasesBlocklist = () => new LanguageSupport(phrasesBlocklistLanguage);
