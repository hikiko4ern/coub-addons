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
			playerSettings.isPreventPlaybackRateChange &&
			(e.which === /* W */ 87 || e.which === /* S */ 83)
		) {
			return e.stopImmediatePropagation();
		}

		if (
			playerSettings.isPreventBuiltInHotkeysIfModPressed &&
			(e.which === /* W */ 87 ||
				e.which === /* S */ 83 ||
				e.which === /* R */ 82 ||
				e.which === /* P */ 80) &&
			(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)
		) {
			return e.stopImmediatePropagation();
		}
	}

	const exportedHandler = exportFunction(handler.bind(player), player);

	prependJqListener(logger, player.vb, H5P_KEY_UP_EVENT, H5P_KEY_UP_EVENT_KEY, exportedHandler);

	return exportedHandler;
};
