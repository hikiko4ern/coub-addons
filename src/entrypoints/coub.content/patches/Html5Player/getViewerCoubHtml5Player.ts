import type { Logger } from '@/utils/logger';

import { H5P_PLAYERS_MAP_SYM } from './constants';

export const getViewerCoubHtml5Player = (
	viewer: JQuery,
	logger: Logger,
	proto: coub.Html5Player['prototype'],
	isJustInitialized?: boolean,
) => {
	const playersMap = proto[H5P_PLAYERS_MAP_SYM];
	const player = playersMap?.get(viewer[0])?.deref();

	if (!player) {
		(isJustInitialized ? logger.warn : logger.error)(
			'player for',
			viewer,
			'not found in',
			playersMap,
		);
		return;
	}

	return player;
};
