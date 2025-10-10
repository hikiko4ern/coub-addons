import { ChannelExclusionReason } from './channel';

export enum CommentExclusionReason {
	CHANNEL_BLOCKED = 'channel-is-blocked',
}

export const ChannelToCommentExclusionReason = {
	[ChannelExclusionReason.BLOCKED]: CommentExclusionReason.CHANNEL_BLOCKED,
} satisfies Record<ChannelExclusionReason, CommentExclusionReason>;
