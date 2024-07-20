import { isObject } from '@/helpers/isObject';
import { prependJqListener } from '@/helpers/prependJqListener';
import { isHotkeyPressed } from '@/hotkey/isHotkeyPressed';
import type { ReadonlyPlayerSettings } from '@/storage/playerSettings';
import type { Logger } from '@/utils/logger';
import { H5P_KEY_UP_EVENT, H5P_KEY_UP_EVENT_KEY } from './constants';

export const addKeyUpHandlerToHtml5Player = (
	logger: Logger,
	player: coub.Html5Player,
	playerSettings: ReadonlyPlayerSettings,
) => {
	function handler(
		this: coub.Html5Player,
		e: JQueryKeyEventObject & { wrappedJSObject?: JQueryKeyEventObject },
	) {
		e = e.wrappedJSObject || e;

		if (
			typeof this.toggleFavourites === 'function' &&
			playerSettings.toggleBookmarkHotkey &&
			isHotkeyPressed(e.originalEvent as KeyboardEvent, playerSettings.toggleBookmarkHotkey)
		) {
			e.stopImmediatePropagation();
			return this.toggleFavourites();
		}

		if (
			typeof this.toggleFullScreen === 'function' &&
			playerSettings.toggleFullscreenHotkey &&
			isHotkeyPressed(e.originalEvent as KeyboardEvent, playerSettings.toggleFullscreenHotkey)
		) {
			e.stopImmediatePropagation();
			return this.toggleFullScreen();
		}

		if (
			playerSettings.copyCoubPermalinkHotkey &&
			isHotkeyPressed(e.originalEvent as KeyboardEvent, playerSettings.copyCoubPermalinkHotkey)
		) {
			logger.debug('copying permalink to', this.data);
			e.stopImmediatePropagation();
			return (
				isObject(this.data) &&
				typeof this.data.permalink === 'string' &&
				this.data.permalink &&
				navigator.clipboard.writeText(
					new URL(`/view/${this.data.permalink}`, window.location.toString()).toString(),
				)
			);
		}

		if (playerSettings.isPreventPlaybackRateChange && (e.which === 87 || e.which === 83)) {
			return e.stopImmediatePropagation();
		}
	}

	const exportedHandler = exportFunction(handler.bind(player), player);

	prependJqListener(logger, player.vb, H5P_KEY_UP_EVENT, H5P_KEY_UP_EVENT_KEY, exportedHandler);

	return exportedHandler;
};
