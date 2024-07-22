import type { Logger } from '@/utils/logger';
import type { PhrasesBlocklist, RawPhrasesBlocklist } from '..';

import { phrasesToTree } from './phrasesTree';
import type { SegmenterUtils } from './segmenterUtils';
import { tryRegexFromLine } from './tryRegexFromLine';

export const parsePhrasesBlocklist = (
	logger: Logger,
	utils: SegmenterUtils,
	raw: RawPhrasesBlocklist,
): PhrasesBlocklist => {
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
		phrases: phrasesToTree(utils, phrases),
		regexps,
	};
};
