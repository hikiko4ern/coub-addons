import type { Channel } from '@/api/types';
import { getChannelTitle } from '@/helpers/channel/getChannelTitle';

interface StoryDataForTitle {
	/** title of the story */
	title: string;
	/** story's author */
	channel: Channel;
}

export interface StoryTitleData {
	/** title of the story */
	title: string;
	/** story's author */
	author: ReturnType<typeof getChannelTitle> | undefined;
}

export const getStoryTitleData = ({ title, channel }: StoryDataForTitle): StoryTitleData => ({
	title,
	author: getChannelTitle(channel),
});
