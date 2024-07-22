import { COMMUNITY_HOT_PREFIX } from '../../constants';

export const JST_ORIGINAL_TEMPLATES_KEY = `${COMMUNITY_HOT_PREFIX}__templates` as const;
export const JST_ORIGINAL_TEMPLATES_SYM = Symbol.for(JST_ORIGINAL_TEMPLATES_KEY);
