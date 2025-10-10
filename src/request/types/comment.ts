import { ChannelExclusionReason } from './channel';

export const COMMENT_HIDDEN_KEY = `${browser.runtime.id}__isHidden`;

export enum CommentHandlingReason {
	CHANNEL_BLOCKED = 'channel-is-blocked',
}

export const ChannelToCommentHandlingReason = {
	[ChannelExclusionReason.BLOCKED]: CommentHandlingReason.CHANNEL_BLOCKED,
} satisfies Record<ChannelExclusionReason, CommentHandlingReason>;
