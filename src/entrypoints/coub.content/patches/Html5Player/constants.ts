import { COUB_PREFIX } from '../../constants';

export const H5P_KEY_UP_EVENT = 'keyup.player' as const;
export const H5P_KEY_UP_EVENT_KEY = 'keyup' as const;

export const H5P_ATTACH_EVENTS_KEY = `${COUB_PREFIX}__attachEvents__orig` as const;
export const H5P_ATTACH_EVENTS_SYM = Symbol.for(H5P_ATTACH_EVENTS_KEY);

export const H5P_KEY_UP_HANDLERS_KEY = `${COUB_PREFIX}__handlers__keyUp` as const;
export const H5P_KEY_UP_HANDLERS_SYM = Symbol.for(H5P_KEY_UP_HANDLERS_KEY);

export const H5P_CHANGE_STATE_KEY = `${COUB_PREFIX}__changeState__orig` as const;
export const H5P_CHANGE_STATE_SYM = Symbol.for(H5P_CHANGE_STATE_KEY);

export const H5P_PLAYERS_MAP_KEY = `${COUB_PREFIX}__playersMap` as const;
export const H5P_PLAYERS_MAP_SYM = Symbol.for(H5P_PLAYERS_MAP_KEY);
