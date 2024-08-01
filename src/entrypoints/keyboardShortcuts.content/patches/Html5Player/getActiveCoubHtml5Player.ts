import type { Logger } from '@/utils/logger';
import { H5P_PLAYERS_MAP_SYM } from './constants';
import { selectActiveCoubViewer } from './selectActiveCoubViewer';

export const getActiveCoubHtml5Player = (
	$: typeof window.$,
	logger: Logger,
	proto: coub.Html5Player['prototype'],
	isJustInitialized?: boolean,
) => {
	const activeCoubViewer = selectActiveCoubViewer($);

	if (!activeCoubViewer.length) {
		logger.warn('there is no active viewer found by selector', activeCoubViewer);
		return;
	}

	const playersMap = proto[H5P_PLAYERS_MAP_SYM];
	const player = playersMap?.get(activeCoubViewer[0])?.deref();

	if (!player) {
		(isJustInitialized ? logger.warn : logger.error)(
			'player for',
			activeCoubViewer,
			'not found in',
			playersMap,
		);
		return;
	}

	return player;
};
