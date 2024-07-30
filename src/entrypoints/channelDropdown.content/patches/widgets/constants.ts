import { CD_PREFIX } from '../../constants';

export const CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_KEY =
	`${CD_PREFIX}__ChannelDropdown__setDropdownContent` as const;
export const CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_SYM = Symbol.for(
	CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_KEY,
);
