export enum CoubExclusionReason {
	COUB_DISLIKED = 'coub-is-disliked',
	CHANNEL_BLOCKED = 'channel-is-blocked',
	TAG_BLOCKED = 'tag-is-blocked',
	COUB_TITLE_BLOCKED = 'coub-title-is-blocked',
	RECOUBS_BLOCKED = 'recoubs-are-blocked',
}

export interface FilteredOutCoubForStats {
	channelPermalink: string | undefined;
	reason: CoubExclusionReason;
}
