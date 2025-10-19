import type { Logger } from '@/utils/logger';

import { getViewerCoubHtml5Player } from './getViewerCoubHtml5Player';
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

	return getViewerCoubHtml5Player(activeCoubViewer, logger, proto, isJustInitialized);
};
