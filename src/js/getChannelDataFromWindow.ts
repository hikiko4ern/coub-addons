import { nanoid } from 'nanoid';
import { type Describe, is, number, string, type } from 'superstruct';

import type { Channel } from '@/types/Channel';
import { Logger } from '@/utils/logger';

const ID = nanoid();
const logger = Logger.create('getChannelDataFromWindow', { devUniqueId: ID });

export const getChannelDataFromWindow = (): Channel | undefined => {
	try {
		const window = globalThis.window.wrappedJSObject || globalThis.window;
		const profileChannel = window.gon.profile_channel;

		if (!is(profileChannel, CoubProfileChannel)) {
			logger.warn('`window.gon.profile_channel` is not a valid CoubProfileChannel', profileChannel);
			return;
		}

		return profileChannel;
	} catch (err) {
		logger.error('failed to get `window.gon.profile_channel`:', err);
	}
};

const CoubProfileChannel: Describe<coub.ProfileChannel> = type({
	id: number(),
	title: string(),
	permalink: string(),
});
