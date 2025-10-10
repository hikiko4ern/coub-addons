import type { Channel } from '@/api/types';
import { getChannelTitle } from '@/helpers/channel/getChannelTitle';

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
	author: ReturnType<typeof getChannelTitle> | undefined;
}

export const getCoubTitleData = ({ title, channel }: CoubDataForTitle): CoubTitleData => ({
	title,
	author: getChannelTitle(channel),
});
