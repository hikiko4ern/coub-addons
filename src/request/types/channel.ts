export enum ChannelExclusionReason {
	BLOCKED = 'blocked',
}

export interface FilteredOutChannelForStats {
	permalink: string | undefined;
	reason: ChannelExclusionReason;
}
