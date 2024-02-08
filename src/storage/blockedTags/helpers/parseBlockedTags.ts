import type { Logger } from '@/utils/logger';
import type { BlockedTags, RawBlockedTags } from '..';
import { phrasesToTree } from './phrasesToTree';

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

		if (line[0] === '/') {
			const lastSlashIndex = line.lastIndexOf('/');

			if (lastSlashIndex !== -1 && lastSlashIndex !== 0) {
				try {
					const re = new RegExp(line.slice(1, lastSlashIndex), line.slice(lastSlashIndex + 1));
					regexps.push(re);
					continue;
				} catch (err) {
					logger.error('failed to parse', line, 'as regex', err);
				}
			}
		}

		phrases.push(line);
	}

	return {
		raw,
		phrases: phrasesToTree(phrases),
		regexps,
	};
};
