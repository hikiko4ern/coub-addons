import { type Describe, number, string, type } from 'superstruct';

export interface Channel {
	id: number;
	title: string;
	permalink: string;
}

export const Channel: Describe<Channel> = type({
	id: number(),
	title: string(),
	permalink: string(),
});
