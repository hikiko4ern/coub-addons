import { ChannelExclusionReason } from './channel';

export enum StoryExclusionReason {
	CHANNEL_BLOCKED = 'channel-is-blocked',
	REPOSTS_BLOCKED = 'reposts-are-blocked',
}

export const ChannelToStoryExclusionReason = {
	[ChannelExclusionReason.BLOCKED]: StoryExclusionReason.CHANNEL_BLOCKED,
} satisfies Record<ChannelExclusionReason, StoryExclusionReason>;

export interface FilteredOutStoryForStats {
	channelPermalink: string | undefined;
	reason: StoryExclusionReason;
}
