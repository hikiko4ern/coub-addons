import type { ArrayValues } from 'type-fest';

import type { ReadonlyPlayerSettings } from '@/storage/playerSettings';
import type { Logger } from '@/utils/logger';
import type { RevertPatch } from '../../types';

import { actualizeMediaSessionFromHtml5Player } from './actualizeMediaSessionFromHtml5Player';
import { addKeyUpHandlerToHtml5Player } from './addKeyUpHandlerToHtml5Player';
import {
	H5P_ATTACH_EVENTS_KEY,
	H5P_ATTACH_EVENTS_SYM,
	H5P_CHANGE_STATE_KEY,
	H5P_CHANGE_STATE_SYM,
	H5P_KEY_UP_EVENT,
	H5P_KEY_UP_HANDLERS_KEY,
	H5P_KEY_UP_HANDLERS_SYM,
	H5P_PLAYERS_MAP_SYM,
} from './constants';
import { getActiveCoubHtml5Player } from './getActiveCoubHtml5Player';
import { getHtml5PlayerGlobals } from './getHtml5PlayerGlobals';
import { revertHtml5PlayerPatches } from './revertHtml5PlayerPatches';
import { selectActiveCoubViewer } from './selectActiveCoubViewer';

type Patches = {
	[key in typeof H5P_ATTACH_EVENTS_SYM]?: coub.Html5Player['attachEvents'];
} & {
	[key in typeof H5P_CHANGE_STATE_SYM]?: coub.Html5Player['changeState'];
} & {
	[key in typeof H5P_PLAYERS_MAP_SYM]?: WeakMap<Element, WeakRef<coub.Html5Player>>;
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
	const { WeakMap, WeakRef, $, Html5Player } = globals;
	const proto = Html5Player.prototype;

	{
		const origAttachEvents = proto[H5P_ATTACH_EVENTS_SYM];

		if (typeof origAttachEvents === 'function') {
			logger.debug('reverting non-reverted `attachEvents` patch');
			proto.attachEvents = origAttachEvents;
			delete proto[H5P_ATTACH_EVENTS_SYM];
		}
	}

	{
		const origChangeState = proto[H5P_CHANGE_STATE_SYM];

		if (typeof origChangeState === 'function') {
			logger.debug('reverting non-reverted `changeState` patch');
			proto.changeState = origChangeState;
			delete proto[H5P_CHANGE_STATE_SYM];
		}
	}

	{
		const origAttachEvents = (proto[H5P_ATTACH_EVENTS_SYM] = proto.attachEvents);

		const patchedAttachEvents: typeof proto.attachEvents = function patchedAttachEvents(...args) {
			const player = this.wrappedJSObject || this;

			if (player.vb instanceof $) {
				// `attachEvents` is called for the first time in the constructor,
				// so we can add handlers with the highest priority
				const exportedHandler = addKeyUpHandlerToHtml5Player(logger, player, playerSettings);
				const handlers = (proto[H5P_KEY_UP_HANDLERS_SYM] ||= cloneInto([], proto));
				const playersMap = (proto[H5P_PLAYERS_MAP_SYM] ||= new WeakMap());

				const playerRef = new WeakRef(player);

				const handlersEntry = cloneInto(
					// clone the array separately from the elements to preserve references to already created/cloned elements
					[] as unknown as ArrayValues<typeof handlers>,
					proto,
				);
				handlers.push(handlersEntry);

				handlersEntry[0] = playerRef;
				handlersEntry[1] = exportedHandler;

				playersMap.set(player.vb[0], playerRef);

				// return the native handler so that our additional logic is not executed in subsequent calls
				player.attachEvents = origAttachEvents.bind(player);
			}

			return Reflect.apply(origAttachEvents, player, args);
		};

		exportFunction(patchedAttachEvents, proto, { defineAs: 'attachEvents' });
	}

	{
		const origChangeState = (proto[H5P_CHANGE_STATE_SYM] = proto.changeState);

		const patchedChangeState: typeof proto.changeState = function patchedChangeState(...args) {
			const player = this.wrappedJSObject || this;

			logger.debug('changing state to', args, 'from', player.state, { player });

			try {
				if (typeof navigator.mediaSession !== 'undefined') {
					const state = args[0];

					if (typeof state === 'string') {
						switch (state) {
							case 'playing':
							case 'paused': {
								actualizeMediaSessionFromHtml5Player(logger, player, state, state === 'playing');
								break;
							}

							case 'unloaded': {
								if (player.vb.parents('.coub.active').length) {
									navigator.mediaSession.playbackState = 'none';
									navigator.mediaSession.metadata = null;
								}
								break;
							}
						}
					}
				}
			} catch (err) {
				logger.error('failed to change `navigator.mediaSession`', err, { player, args });
			}

			return Reflect.apply(origChangeState, player, args);
		};

		exportFunction(patchedChangeState, proto, { defineAs: 'changeState' });

		if (typeof navigator.mediaSession !== 'undefined') {
			const msLogger = logger.getChildLogger('MediaSession');

			{
				const player = getActiveCoubHtml5Player($, msLogger, proto);
				player && actualizeMediaSessionFromHtml5Player(msLogger, player);
			}

			try {
				navigator.mediaSession.setActionHandler('play', () => {
					try {
						const player = getActiveCoubHtml5Player($, msLogger, proto);

						if (!player) {
							return;
						}

						msLogger.debug('play', { player });

						if (player) {
							player.play(true);
							player.preloadDefer?.play.done(
								exportFunction(() => {
									if (player.browserPaused && !player.hasFocus()) {
										player.playLoop();
										player.browserPaused = false;
									}
								}, player.preloadDefer),
							);
						}
					} catch (err) {
						msLogger.debug('`play` handler thrown', err);
					}
				});
			} catch (err) {
				msLogger.error('failed to set `play` handler', err);
			}

			try {
				navigator.mediaSession.setActionHandler('pause', () => {
					try {
						const viewer = selectActiveCoubViewer($);
						msLogger.debug('pause', viewer);

						if (!viewer.length) {
							msLogger.warn('there is no active viewer found by selector');
							return;
						}

						/** @see Html5Player.suspend */
						viewer.triggerHandler('suspend');
					} catch (err) {
						msLogger.debug('`pause` handler thrown', err);
					}
				});
			} catch (err) {
				msLogger.error('failed to set `pause` handler', err);
			}

			try {
				navigator.mediaSession.setActionHandler('stop', () => {
					try {
						const viewer = selectActiveCoubViewer($);
						msLogger.debug('stop', viewer);

						if (!viewer.length) {
							msLogger.warn('there is no active viewer found by selector');
							return;
						}

						/** @see Html5Player.pause */
						viewer.triggerHandler('pause');
					} catch (err) {
						msLogger.debug('`stop` handler thrown', err);
					}
				});
			} catch (err) {
				msLogger.error('failed to set `stop` handler', err);
			}
		}
	}

	try {
		const keyUpHandlers = proto[H5P_KEY_UP_HANDLERS_SYM];

		if (Array.isArray(keyUpHandlers)) {
			for (const entry of keyUpHandlers) {
				try {
					const [playerRef, handler] = entry;
					const player = playerRef.deref();

					if (player) {
						handler && player.vb.off(H5P_KEY_UP_EVENT, handler);
						entry[1] = addKeyUpHandlerToHtml5Player(logger, player, playerSettings);
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
			H5P_CHANGE_STATE_KEY,
			undefined,
			logger,
			proto,
		);
	};
}
