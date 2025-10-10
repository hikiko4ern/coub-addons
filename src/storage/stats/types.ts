import type { ChannelExclusionReason } from '@/request/types/channel';
import type { CommentExclusionReason } from '@/request/types/comment';
import type { CoubExclusionReason } from '@/request/types/coub';
import type { StoryExclusionReason } from '@/request/types/story';

// v1

type CoubExclusionReasonV1 =
	| CoubExclusionReason.COUB_DISLIKED
	| CoubExclusionReason.CHANNEL_BLOCKED;

export interface StatsV1 {
	filtered: Record<CoubExclusionReasonV1, number>;
}

// v2

type CoubExclusionReasonV2 = CoubExclusionReasonV1 | CoubExclusionReason.TAG_BLOCKED;

export interface StatsV2 {
	filtered: Record<CoubExclusionReasonV2, number>;
}

// v3

type CoubExclusionReasonV3 = CoubExclusionReasonV2 | CoubExclusionReason.COUB_TITLE_BLOCKED;

export interface StatsV3 {
	filtered: Record<CoubExclusionReasonV3, number>;
}

// v4

type CoubExclusionReasonV4 = CoubExclusionReasonV3 | CoubExclusionReason.RECOUBS_BLOCKED;

export interface StatsV4 {
	filtered: Record<CoubExclusionReasonV4, number>;
}

// v5

type CoubExclusionReasonV5 = CoubExclusionReasonV4;
type CommentExclusionReasonV5 = CommentExclusionReason.CHANNEL_BLOCKED;

export interface StatsV5 {
	filteredCoubs: Record<CoubExclusionReasonV5, number>;
	filteredComments: Record<CommentExclusionReasonV5, number>;
}

// v6

type CoubExclusionReasonV6 = CoubExclusionReasonV5;
type StoryExclusionReasonV6 = StoryExclusionReason.CHANNEL_BLOCKED;
type CommentExclusionReasonV6 = CommentExclusionReasonV5;

export interface StatsV6 {
	filteredCoubs: Record<CoubExclusionReasonV6, number>;
	filteredStories: Record<StoryExclusionReasonV6, number>;
	filteredComments: Record<CommentExclusionReasonV6, number>;
}

// v7

type CoubExclusionReasonV7 = CoubExclusionReasonV6;
type StoryExclusionReasonV7 = StoryExclusionReasonV6 | StoryExclusionReason.REPOSTS_BLOCKED;
type CommentExclusionReasonV7 = CommentExclusionReasonV6;

export interface StatsV7 {
	filteredCoubs: Record<CoubExclusionReasonV7, number>;
	filteredStories: Record<StoryExclusionReasonV7, number>;
	filteredComments: Record<CommentExclusionReasonV7, number>;
}

// v8

type CoubExclusionReasonV8 = CoubExclusionReasonV7 | CoubExclusionReason.REPOSTS_BLOCKED;
type StoryExclusionReasonV8 = StoryExclusionReasonV7;
type CommentExclusionReasonV8 = CommentExclusionReasonV7;

export interface StatsV8 {
	filteredCoubs: Record<CoubExclusionReasonV8, number>;
	filteredStories: Record<StoryExclusionReasonV8, number>;
	filteredComments: Record<CommentExclusionReasonV8, number>;
}

// v9

type ChannelExclusionReasonV9 = ChannelExclusionReason.BLOCKED;
type CoubExclusionReasonV9 = CoubExclusionReasonV8;
type StoryExclusionReasonV9 = StoryExclusionReasonV8;
type CommentExclusionReasonV9 = CommentExclusionReasonV8;

export interface StatsV9 {
	filteredChannels: Record<ChannelExclusionReasonV9, number>;
	filteredCoubs: Record<CoubExclusionReasonV9, number>;
	filteredStories: Record<StoryExclusionReasonV9, number>;
	filteredComments: Record<CommentExclusionReasonV9, number>;
}
