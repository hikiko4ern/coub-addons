export enum StoryExclusionReason {
	CHANNEL_BLOCKED = 'channel-is-blocked',
}

export interface FilteredOutStoryForStats {
	channelPermalink: string | undefined;
	reason: StoryExclusionReason;
}
