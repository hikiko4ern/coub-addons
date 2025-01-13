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

export type RawBlockedChannelsShards = (
	| {
			[key in keyof RawBlockedChannels]: {
				key: key;
				value: RawBlockedChannels[key];
			};
	  }
	| {
			[key in keyof RawBlockedChannels]: {
				key: `${key}#${number}`;
				value: RawBlockedChannels[key];
			};
	  }
)[keyof RawBlockedChannels][];
