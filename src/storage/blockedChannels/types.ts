export interface BlockedChannelData {
	id: number;
	title: string;
	permalink: string | undefined;
}

export interface RawBlockedChannels {
	id: number[];
	title: string[];
	permalink: (string | undefined)[];
}
