import type { RawBlockedChannels } from '../types';
import { iterRawBlockedChannels } from './iterRawBlockedChannels';

export const mergeBlockedChannels = (
	current: RawBlockedChannels,
	backup: RawBlockedChannels,
): RawBlockedChannels => {
	const currentIds = new Set(current.id);

	for (const backupRaw of iterRawBlockedChannels(backup)) {
		if (!currentIds.has(backupRaw.id)) {
			current.id.push(backupRaw.id);
			current.title.push(backupRaw.title);
			current.permalink.push(backupRaw.permalink);
		}
	}

	return current;
};
