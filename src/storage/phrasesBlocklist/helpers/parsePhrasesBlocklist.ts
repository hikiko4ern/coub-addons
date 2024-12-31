import type { Logger } from '@/utils/logger';
import type { PhrasesBlocklist, RawPhrasesBlocklist } from '..';

import { phrasesToTree } from './phrasesTree';
import type { SegmenterUtils } from './segmenterUtils';
import { tryRegexFromLine } from './tryRegexFromLine';

export const parsePhrasesBlocklist = (
	logger: Pick<Logger, 'error'>,
	utils: SegmenterUtils,
	raw: RawPhrasesBlocklist,
): PhrasesBlocklist => {
	const lines = raw.split('\n');
	const length = lines.length;

	const phrases: [phrase: string, pos: number][] = [];
	const regexps: [re: RegExp, pos: number][] = [];
	let pos = 0;

	for (let i = 0; i < length; i++) {
		const line = lines[i];

		if (!line.length) {
			pos += 1;
			continue;
		}

		const newPos = pos + line.length + 1;

		try {
			const maybeRegex = tryRegexFromLine(line);

			if (maybeRegex) {
				regexps.push([maybeRegex, pos]);
				pos = newPos;
				continue;
			}
		} catch (err) {
			!(err instanceof SyntaxError) && logger.error('failed to parse', line, 'as regex', err);
		}

		phrases.push([line, pos]);
		pos = newPos;
	}

	return {
		raw,
		phrases: phrasesToTree(utils, phrases),
		regexps,
	};
};
