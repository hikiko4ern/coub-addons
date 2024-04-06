import type { Logger } from '@/utils/logger';
import type { BlockedTags, RawBlockedTags } from '..';

import { phrasesToTree } from './phrasesTree';
import { tryRegexFromLine } from './tryRegexFromLine';

export const parseBlockedTags = (logger: Logger, raw: RawBlockedTags): BlockedTags => {
	const lines = raw.split('\n');
	const length = lines.length;

	const phrases: string[] = [];
	const regexps: RegExp[] = [];

	for (let i = 0; i < length; i++) {
		const line = lines[i];

		if (!line.length) {
			continue;
		}

		try {
			const maybeRegex = tryRegexFromLine(line);

			if (maybeRegex) {
				regexps.push(maybeRegex);
				continue;
			}
		} catch (err) {
			!(err instanceof SyntaxError) && logger.error('failed to parse', line, 'as regex', err);
		}

		phrases.push(line);
	}

	return {
		raw,
		phrases: phrasesToTree(phrases),
		regexps,
	};
};
