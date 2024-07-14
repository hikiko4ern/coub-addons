import type { Channel } from '@/api/types';

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
	author: string | number | undefined;
}

export const getStoryTitleData = ({ title, channel }: StoryDataForTitle): StoryTitleData => ({
	title,
	author: channel?.title || channel?.id,
});
