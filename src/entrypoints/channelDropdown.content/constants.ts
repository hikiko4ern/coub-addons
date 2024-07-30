export const CD_PREFIX = `${browser.runtime.id}__channelDropdown` as const;

export const CD_ADDED_NODES_KEY = `${CD_PREFIX}__addedNodes` as const;
export const CD_ADDED_NODES_SYM = Symbol.for(CD_ADDED_NODES_KEY);
