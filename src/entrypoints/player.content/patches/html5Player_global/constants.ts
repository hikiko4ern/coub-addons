import { PLAYER_SHORTCUTS_PREFIX } from '../../constants';

export const H5PG_UI_ORIG_INIT_KEY = `${PLAYER_SHORTCUTS_PREFIX}__UI__init__orig` as const;
export const H5PG_UI_ORIG_INIT_SYM = Symbol.for(H5PG_UI_ORIG_INIT_KEY);
