import { PLAYER_SHORTCUTS_PREFIX } from '../../constants';

export const CBC_VIEWER_BLOCK_KEY_UP_EVENT = 'keyup' as const;
export const CBC_VIEWER_BLOCK_KEY_UP_EVENT_KEY = 'keyup' as const;

export const CBC_GET_VIEWER_BLOCK_KEY = `${PLAYER_SHORTCUTS_PREFIX}__getViewerBlock__orig` as const;
export const CBC_GET_VIEWER_BLOCK_SYM = Symbol.for(CBC_GET_VIEWER_BLOCK_KEY);

export const CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_KEY =
	`${PLAYER_SHORTCUTS_PREFIX}__viewerBlock__handlers__keyUp` as const;
export const CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_SYM = Symbol.for(
	CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_KEY,
);
