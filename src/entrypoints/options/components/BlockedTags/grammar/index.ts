import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';

import { parser } from './syntax.grammar';

export const tagsLanguage = LRLanguage.define({
	parser: parser.configure({
		props: [
			styleTags({
				RegExp: t.regexp,
			}),
		],
	}),
});

export const tags = () => new LanguageSupport(tagsLanguage);
