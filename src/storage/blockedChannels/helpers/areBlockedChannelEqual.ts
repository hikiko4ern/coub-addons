import type { BlockedChannelData } from '../types';

export const areBlockedChannelEqual = (a: BlockedChannelData, b: BlockedChannelData) =>
	a.id === b.id && a.permalink === b.permalink && a.title === b.title;
