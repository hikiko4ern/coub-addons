import type { ArrayValues } from 'type-fest';

import type { RevertPatch } from '@/helpers/patch/applyPatches';
import { patchMethod } from '@/helpers/patch/patchMethod';
import type { ReadonlyPlayerSettings } from '@/storage/playerSettings';
import type { Logger } from '@/utils/logger';

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
import { type Html5PlayerGlobals, getHtml5PlayerGlobals } from './getHtml5PlayerGlobals';
import { getViewerCoubHtml5Player } from './getViewerCoubHtml5Player';
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
	_waivedWindow: typeof window,
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

	patchMethod(
		logger,
		proto,
		'attachEvents',
		H5P_ATTACH_EVENTS_SYM,
		function patchedAttachEvents(origAttachEvents, ...args) {
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
		},
	);

	patchMethod(
		logger,
		proto,
		'changeState',
		H5P_CHANGE_STATE_SYM,
		function patchedChangeState(origChangeState, ...args) {
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
		},
	);

	addMediaSessionHandlers(logger, globals);

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

const addMediaSessionHandlers = (parentLogger: Logger, { $, Html5Player }: Html5PlayerGlobals) => {
	if (!navigator.mediaSession) {
		return;
	}

	const logger = parentLogger.getChildLogger('MediaSession');
	const proto = Html5Player.prototype;

	{
		const player = getActiveCoubHtml5Player($, logger, proto, true);
		player && actualizeMediaSessionFromHtml5Player(logger, player);
	}

	type ActionHandler = (logger: Logger, details: MediaSessionActionDetails) => void;

	const setHandler = (action: MediaSessionAction, handler: ActionHandler) => {
		const actionLogger = logger.getChildLogger(action);

		try {
			navigator.mediaSession.setActionHandler(action, (...args) => {
				logger.group(action);

				try {
					handler(actionLogger, ...args);
				} catch (err) {
					logger.error('handler thrown:', err);
				}

				logger.groupEnd();
			});
		} catch (err) {
			logger.error(`failed to set \`${action}\` handler`, err);
		}
	};

	const play = (player: coub.Html5Player | undefined) => {
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
	};

	setHandler('play', logger => {
		const player = getActiveCoubHtml5Player($, logger, proto);
		logger.debug('player:', player);
		play(player);
	});

	setHandler('pause', logger => {
		const viewer = selectActiveCoubViewer($);
		logger.debug('viewer:', viewer);

		if (!viewer.length) {
			logger.warn('there is no active viewer found by selector');
			return;
		}

		/** @see Html5Player.suspend */
		viewer.triggerHandler('suspend');
	});

	setHandler('stop', logger => {
		const viewer = selectActiveCoubViewer($);
		logger.debug('viewer:', viewer);

		if (!viewer.length) {
			logger.warn('there is no active viewer found by selector');
			return;
		}

		/** @see Html5Player.pause */
		viewer.triggerHandler('pause');
	});

	type KeyPressEventData = Required<Pick<KeyboardEventInit, 'which' | 'code'>>;

	const dispatchKeyPress = (el: JQuery, data: KeyPressEventData, eventTarget?: string) => {
		const clonedData = cloneInto(data, el);
		{
			const e = $.Event(eventTarget ? `keydown.${eventTarget}` : 'keydown');
			e.which = data.which;
			e.originalEvent = new KeyboardEvent('keydown', clonedData);
			el.trigger(e);
		}
		{
			const e = $.Event(eventTarget ? `keyup.${eventTarget}` : 'keyup');
			e.which = data.which;
			e.originalEvent = new KeyboardEvent('keyup', clonedData);
			el.trigger(e);
		}
	};

	const createSwitchTrackHandler = (dir: 'next' | 'prev'): ActionHandler => {
		const data: KeyPressEventData =
			dir === 'next' ? { which: 40, code: 'ArrowDown' } : { which: 38, code: 'ArrowUp' };

		const dataFullscreen: KeyPressEventData =
			dir === 'next' ? { which: 39, code: 'ArrowRight' } : { which: 37, code: 'ArrowLeft' };

		return logger => {
			if (document.fullscreenElement) {
				logger.debug('fullscreen');

				let viewer = selectActiveCoubViewer($);
				logger.debug('viewer:', viewer);

				if (!viewer.length) {
					logger.warn('there is no active viewer found by selector');
					return;
				}

				dispatchKeyPress(viewer, dataFullscreen, 'timelineFullScreenChanger');

				viewer = selectActiveCoubViewer($).not(viewer);

				if (!viewer.length) {
					logger.warn('there is no active viewer found by selector');
					return;
				}

				const player = getViewerCoubHtml5Player(viewer, logger, proto);
				logger.debug('play', { player });
				play(player);

				return;
			}

			const viewer = selectActiveCoubViewer($);
			logger.debug('viewer:', viewer);

			if (!viewer.length) {
				logger.warn('there is no active viewer found by selector');
				return;
			}

			dispatchKeyPress(viewer, data);

			const player = getActiveCoubHtml5Player($, logger, proto);
			logger.debug('play', { player });
			play(player);
		};
	};

	setHandler('previoustrack', createSwitchTrackHandler('prev'));
	setHandler('nexttrack', createSwitchTrackHandler('next'));
};
