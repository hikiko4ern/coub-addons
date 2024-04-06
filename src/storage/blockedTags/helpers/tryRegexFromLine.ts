export const tryRegexFromLine = (line: string): RegExp | undefined => {
	if (line[0] === '/') {
		const lastSlashIndex = line.lastIndexOf('/');

		if (lastSlashIndex !== -1 && lastSlashIndex !== 0) {
			return new RegExp(line.slice(1, lastSlashIndex), line.slice(lastSlashIndex + 1));
		}
	}
};
