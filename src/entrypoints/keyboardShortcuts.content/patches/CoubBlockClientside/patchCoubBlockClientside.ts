import type { ArrayValues } from 'type-fest';

import { isHotkeyPressed } from '@/hotkey/isHotkeyPressed';
import type { ReadonlyPlayerSettings } from '@/storage/playerSettings';
import type { Logger } from '@/utils/logger';
import type { RevertPatch } from '../../types';

import { isObject } from '@/helpers/isObject';
import { prependJqListener } from '@/helpers/prependJqListener';
import {
	CBC_GET_VIEWER_BLOCK_KEY,
	CBC_GET_VIEWER_BLOCK_SYM,
	CBC_VIEWER_BLOCK_KEY_UP_EVENT,
	CBC_VIEWER_BLOCK_KEY_UP_EVENT_KEY,
	CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_KEY,
	CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_SYM,
} from './constants';
import {
	type CoubBlockClientsideGlobals,
	getCoubBlockClientsideGlobals,
} from './getCoubBlockClientsideGlobals';
import { revertCoubBlockClientsidePatches } from './revertCoubBlockClientsidePatches';

type Patches = {
	[key in typeof CBC_GET_VIEWER_BLOCK_SYM]?: coub.CoubBlockClientside['getViewerBlock'];
} & {
	[key in typeof CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_SYM]?: [
		cbcRef: WeakRef<coub.CoubBlockClientside>,
		handler: ((eventObject: JQueryEventObject, ...args: unknown[]) => unknown) | undefined,
	][];
};

declare global {
	namespace coub {
		interface CoubBlockClientsidePatches extends Patches {}
	}
}

const DISLIKE_BUTTON_SELECTOR = '.coub__dislike-button' as const;

export function patchCoubBlockClientside(
	parentLogger: Logger,
	playerSettings: ReadonlyPlayerSettings,
): RevertPatch | unknown[] {
	const logger = parentLogger.getChildLogger('CoubBlockClientside');
	const validatedGlobals = getCoubBlockClientsideGlobals();

	if (!validatedGlobals.isValid) {
		return validatedGlobals.ret;
	}

	const globals = validatedGlobals.ret;
	const { CoubBlockClientside, WeakRef } = globals;
	const proto = CoubBlockClientside.prototype;

	{
		const origGetViewerBlock = proto[CBC_GET_VIEWER_BLOCK_SYM];

		if (typeof origGetViewerBlock === 'function') {
			logger.debug('reverting non-reverted `getViewerBlock` patch');
			proto.getViewerBlock = origGetViewerBlock;
			delete proto[CBC_GET_VIEWER_BLOCK_SYM];
		}
	}

	const origGetViewerBlock = (proto[CBC_GET_VIEWER_BLOCK_SYM] = proto.getViewerBlock);

	const patchedGetViewerBlock: typeof proto.getViewerBlock = function patchedGetViewerBlock(
		...args
	) {
		const cbc = this.wrappedJSObject || this;
		const node = Reflect.apply(origGetViewerBlock, this, args);

		// `getViewerBlock` is called for the first time in the constructor,
		// so we can add handlers with the highest priority
		const exportedHandler = addKeyUpHandlerToNode(logger, globals, playerSettings, node, this);

		const handlers = (proto[CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_SYM] ||= cloneInto([], proto));

		const handlersEntry = cloneInto(
			// clone the array separately from the elements to preserve references to already created/cloned elements
			[] as unknown as ArrayValues<typeof handlers>,
			proto,
		);
		handlers.push(handlersEntry);

		handlersEntry[0] = new WeakRef(cbc);
		handlersEntry[1] = exportedHandler;

		// return the native handler so that our additional logic is not executed in subsequent calls
		this.getViewerBlock = origGetViewerBlock.bind(this);

		return node;
	};

	exportFunction(patchedGetViewerBlock, proto, { defineAs: 'getViewerBlock' });

	try {
		const viewerBlockKeyUpHandlers = proto[CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_SYM];

		if (Array.isArray(viewerBlockKeyUpHandlers)) {
			for (const entry of viewerBlockKeyUpHandlers) {
				try {
					const [cbcRef, handler] = entry;
					const cbc = cbcRef.deref();

					if (cbc) {
						const viewerBlock = cbc.getViewerBlock();
						handler && viewerBlock.off(CBC_VIEWER_BLOCK_KEY_UP_EVENT, handler);
						entry[1] = addKeyUpHandlerToNode(
							logger,
							globals,
							playerSettings,
							viewerBlock,
							CoubBlockClientside,
						);
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

		revertCoubBlockClientsidePatches(
			CBC_GET_VIEWER_BLOCK_KEY,
			CBC_VIEWER_BLOCK_KEY_UP_EVENT,
			CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_KEY,
			undefined,
			logger,
			proto,
		);
	};
}

const addKeyUpHandlerToNode = (
	logger: Logger,
	{ $ }: CoubBlockClientsideGlobals,
	playerSettings: ReadonlyPlayerSettings,
	node: JQuery,
	exportTo: unknown,
) => {
	let toggleDislikeAction: ReturnType<typeof getToggleDislikeAction>;

	const handler = (e: JQueryKeyEventObject & { wrappedJSObject?: JQueryKeyEventObject }) => {
		e = e.wrappedJSObject || e;

		if (
			(toggleDislikeAction ??= getToggleDislikeAction(logger)) &&
			playerSettings.toggleDislikeHotkey &&
			isHotkeyPressed(e.originalEvent as KeyboardEvent, playerSettings.toggleDislikeHotkey)
		) {
			e.stopImmediatePropagation();
			return $(DISLIKE_BUTTON_SELECTOR, node).triggerHandler(toggleDislikeAction as string);
		}
	};

	const exportedHandler = exportFunction(handler, exportTo);

	prependJqListener(
		logger,
		node,
		CBC_VIEWER_BLOCK_KEY_UP_EVENT,
		CBC_VIEWER_BLOCK_KEY_UP_EVENT_KEY,
		exportedHandler,
	);

	return exportedHandler;
};

const getToggleDislikeAction = (logger: Logger): string | 0 => {
	const DislikeButton = (window.wrappedJSObject || window).widgets?.DislikeButton;

	if (
		(typeof DislikeButton === 'function' || isObject(DislikeButton)) &&
		isObject(DislikeButton.ACTIONS) &&
		'TOGGLE_DISLIKE' in DislikeButton.ACTIONS &&
		DislikeButton.ACTIONS.TOGGLE_DISLIKE
	) {
		return DislikeButton.ACTIONS.TOGGLE_DISLIKE;
	}

	logger.warn('`DislikeButton.ACTIONS.TOGGLE_DISLIKE` is not defined', DislikeButton);

	return 0;
};
