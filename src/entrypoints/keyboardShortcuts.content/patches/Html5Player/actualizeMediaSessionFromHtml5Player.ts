import { isObject } from '@/helpers/isObject';
import type { Logger } from '@/utils/logger';

export const actualizeMediaSessionFromHtml5Player = (
	logger: Logger,
	player: coub.Html5Player,
	state = player.state,
	isSetMetadata = true,
) => {
	if (state === 'playing' || state === 'paused') {
		try {
			navigator.mediaSession.playbackState = state;

			if (isSetMetadata && isObject(player.data)) {
				navigator.mediaSession.metadata = new MediaMetadata({
					title: player.data.title,
					artist: player.data.channel.title,
					artwork: [
						{
							src: player.data.timeline_picture,
						},
					],
				});
			}
		} catch (err) {
			logger.error('failed to actualize MediaSession', err);
		}
	}
};
