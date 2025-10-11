import type { Channel } from '@/api/types';

import { getChannelTitle } from './getChannelTitle';

export interface ChannelTitleData {
	title: ReturnType<typeof getChannelTitle> | undefined;
}

export const getChannelTitleData = (channel: Channel): ChannelTitleData => ({
	title: getChannelTitle(channel),
});
