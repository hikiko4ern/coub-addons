export enum StoryExclusionReason {
	CHANNEL_BLOCKED = 'channel-is-blocked',
	REPOSTS_BLOCKED = 'reposts-are-blocked',
}

export interface FilteredOutStoryForStats {
	channelPermalink: string | undefined;
	reason: StoryExclusionReason;
}
