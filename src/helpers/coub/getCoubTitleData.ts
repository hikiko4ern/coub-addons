import type { Channel } from '@/api/types';

interface CoubDataForTitle {
	/** title of the coub */
	title: string;
	/** coub's author */
	channel: Channel;
}

export interface CoubTitleData {
	/** title of the coub */
	title: string;
	/** coub's author */
	author: string | number | undefined;
}

export const getCoubTitleData = ({ title, channel }: CoubDataForTitle): CoubTitleData => ({
	title,
	author: channel?.title || channel?.id,
});
