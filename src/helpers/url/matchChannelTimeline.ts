import { match } from 'path-to-regexp';

export const matchChannelTimeline = match<{ permalink: string }>(
	'/api/v2/timeline/channel/:permalink',
	{ sensitive: true },
);
