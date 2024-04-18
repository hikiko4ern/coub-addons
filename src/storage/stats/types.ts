import type { CoubExclusionReason } from '@/request/coub';

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
