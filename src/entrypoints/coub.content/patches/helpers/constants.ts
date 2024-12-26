import { COUB_PREFIX } from '../../constants';

export const APPLICATION_ORIGINAL_SMART_DATE_TIME_KEY =
	`${COUB_PREFIX}__application__smartDateTime__orig` as const;
export const APPLICATION_ORIGINAL_SMART_DATE_TIME_SYM = Symbol.for(
	APPLICATION_ORIGINAL_SMART_DATE_TIME_KEY,
);
