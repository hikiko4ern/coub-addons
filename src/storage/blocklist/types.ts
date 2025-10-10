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

// v4

export interface BlocklistV4 extends BlocklistV3 {
	isBlockRepostsOfCoubs: boolean;
}

// v5

export enum CommentFromBlockedChannelActionV5 {
	Show = 'show',
	HideMessage = 'hide-message',
	RemoveWithReplies = 'remove-with-replies',
}

export interface BlocklistV5 extends Omit<BlocklistV4, 'isHideCommentsFromBlockedChannels'> {
	commentsFromBlockedChannels: CommentFromBlockedChannelActionV5;
}
