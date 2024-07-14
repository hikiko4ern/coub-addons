// v1

export interface BlocklistV1 {
	isBlockRecoubs: boolean;
}

// v2

export interface BlocklistV2 extends BlocklistV1 {
	isHideCommentsFromBlockedChannels: boolean;
}

// v3

export interface BlocklistV3 extends BlocklistV2 {
	isBlockRepostsOfStories: boolean;
}
