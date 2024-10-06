import type { RawPhrasesBlocklist } from '../types';

export const mergePhrasesBlocklist = (
	current: RawPhrasesBlocklist,
	backup: RawPhrasesBlocklist,
): RawPhrasesBlocklist => {
	backup = backup.trim();

	if (!backup) {
		return current;
	}

	const currentLines = new Set(current.split('\n'));
	let additionalLines = '';

	for (const backupLine of backup.split('\n')) {
		if (!backupLine || !currentLines.has(backupLine)) {
			additionalLines && (additionalLines += '\n');
			additionalLines += backupLine;
		}
	}

	return additionalLines
		? !current || current.endsWith('\n')
			? current + additionalLines
			: `${current}\n${additionalLines}`
		: current;
};
