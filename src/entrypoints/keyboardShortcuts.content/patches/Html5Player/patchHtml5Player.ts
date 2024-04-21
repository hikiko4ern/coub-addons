import type { ArrayValues } from 'type-fest';

import { isHotkeyPressed } from '@/hotkey/isHotkeyPressed';
import type { ReadonlyPlayerSettings } from '@/storage/playerSettings';
import type { Logger } from '@/utils/logger';
import type { RevertPatch } from '../../types';

import { prependJqListener } from '@/helpers/prependJqListener';
import {
	H5P_ATTACH_EVENTS_KEY,
	H5P_ATTACH_EVENTS_SYM,
	H5P_KEY_UP_EVENT,
	H5P_KEY_UP_EVENT_KEY,
	H5P_KEY_UP_HANDLERS_KEY,
	H5P_KEY_UP_HANDLERS_SYM,
} from './constants';
import { getHtml5PlayerGlobals } from './getHtml5PlayerGlobals';
import { revertHtml5PlayerPatches } from './revertHtml5PlayerPatches';

type Patches = {
	[key in typeof H5P_ATTACH_EVENTS_SYM]?: coub.Html5Player['attachEvents'];
} & {
	[key in typeof H5P_KEY_UP_HANDLERS_SYM]?: [
		playerRef: WeakRef<coub.Html5Player>,
		handler: ((eventObject: JQueryEventObject, ...args: unknown[]) => unknown) | undefined,
	][];
};

declare global {
	namespace coub {
		interface Html5PlayerPatches extends Patches {}
	}
}

export function patchHtml5Player(
	parentLogger: Logger,
	playerSettings: ReadonlyPlayerSettings,
): RevertPatch | unknown[] {
	const logger = parentLogger.getChildLogger('Html5Player');
	const validatedGlobals = getHtml5PlayerGlobals(logger);

	if (!validatedGlobals.isValid) {
		return validatedGlobals.ret;
	}

	const globals = validatedGlobals.ret;
	const { WeakRef, $, Html5Player } = globals;
	const proto = Html5Player.prototype;

	{
		const origAttachEvents = proto[H5P_ATTACH_EVENTS_SYM];

		if (typeof origAttachEvents === 'function') {
			logger.debug('reverting non-reverted `attachEvents` patch');
			proto.attachEvents = origAttachEvents;
			delete proto[H5P_ATTACH_EVENTS_SYM];
		}
	}

	const origAttachEvents = (proto[H5P_ATTACH_EVENTS_SYM] = proto.attachEvents);

	const patchedAttachEvents: typeof proto.attachEvents = function patchedAttachEvents(...args) {
		const player = this.wrappedJSObject || this;

		if (player.vb instanceof $) {
			// `attachEvents` is called for the first time in the constructor,
			// so we can add handlers with the highest priority
			const exportedHandler = addKeyUpHandlerToNode(logger, player, playerSettings);
			const handlers = (proto[H5P_KEY_UP_HANDLERS_SYM] ||= cloneInto([], proto));

			const handlersEntry = cloneInto(
				// clone the array separately from the elements to preserve references to already created/cloned elements
				[] as unknown as ArrayValues<typeof handlers>,
				proto,
			);
			handlers.push(handlersEntry);

			handlersEntry[0] = new WeakRef(player);
			handlersEntry[1] = exportedHandler;

			// return the native handler so that our additional logic is not executed in subsequent calls
			player.attachEvents = origAttachEvents.bind(player);
		}

		return Reflect.apply(origAttachEvents, player, args);
	};

	exportFunction(patchedAttachEvents, proto, { defineAs: 'attachEvents' });

	try {
		const keyUpHandlers = proto[H5P_KEY_UP_HANDLERS_SYM];

		if (Array.isArray(keyUpHandlers)) {
			for (const entry of keyUpHandlers) {
				try {
					const [playerRef, handler] = entry;
					const player = playerRef.deref();

					if (player) {
						handler && player.vb.off(H5P_KEY_UP_EVENT, handler);
						entry[1] = addKeyUpHandlerToNode(logger, player, playerSettings);
					}
				} catch (err) {
					logger.error('failed to reinitialize previous handler:', err);
				}
			}

			logger.debug('reinitialized previous handlers successfully');
		}
	} catch (err) {
		logger.error('failed to reinitialize previous handlers:', err);
	}

	logger.debug('patched successfully');

	return () => {
		logger.debug('removing patches');

		revertHtml5PlayerPatches(
			H5P_ATTACH_EVENTS_KEY,
			H5P_KEY_UP_EVENT,
			H5P_KEY_UP_HANDLERS_KEY,
			undefined,
			logger,
			proto,
		);
	};
}

const addKeyUpHandlerToNode = (
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

		if (playerSettings.isPreventPlaybackRateChange && (e.which === 87 || e.which === 83)) {
			return e.stopImmediatePropagation();
		}
	}

	const exportedHandler = exportFunction(handler.bind(player), player);

	prependJqListener(logger, player.vb, H5P_KEY_UP_EVENT, H5P_KEY_UP_EVENT_KEY, exportedHandler);

	return exportedHandler;
};
