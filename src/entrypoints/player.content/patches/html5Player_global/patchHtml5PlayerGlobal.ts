import { type RevertPatch, applyPatches } from '@/helpers/patch/applyPatches';
import type { ReadonlyPlayerSettings } from '@/storage/playerSettings';
import type { Logger } from '@/utils/logger';

import { H5PG_UI_ORIG_INIT_KEY, H5PG_UI_ORIG_INIT_SYM } from './constants';
import { revertHtml5PlayerGlobalPatches } from './revertHtml5PlayerGlobalPatches';

type Patches = {
	[key in typeof H5PG_UI_ORIG_INIT_SYM]?: typeof window.html5Player.UI.prototype.init;
};

declare global {
	namespace coub {
		namespace html5Player {
			interface UIPatches extends Patches {}
		}
	}
}

export function patchHtml5PlayerGlobal(
	parentLogger: Logger,
	waivedWindow: typeof window,
	playerSettings: ReadonlyPlayerSettings,
): RevertPatch | unknown[] {
	const logger = parentLogger.getChildLogger('html5Player');

	const html5Player = waivedWindow.html5Player;

	const patches = applyPatches(
		logger,
		html5Player,
		{
			UI: patchUI,
		},
		waivedWindow,
		playerSettings,
		html5Player,
	);

	logger.debug('patched successfully');

	return () => {
		logger.debug('removing patches');

		for (const revert of patches) {
			revert?.();
		}

		revertHtml5PlayerGlobalPatches(
			H5PG_UI_ORIG_INIT_KEY,
			undefined,
			logger,
			waivedWindow.html5Player,
		);
	};
}

const patchUI = (
	parentLogger: Logger,
	waivedWindow: typeof window,
	playerSettings: ReadonlyPlayerSettings,
	html5Player: typeof window.html5Player,
) => {
	const logger = parentLogger.getChildLogger('UI');
	const proto = html5Player.UI.prototype;

	{
		const origInit = proto[H5PG_UI_ORIG_INIT_SYM];

		if (typeof origInit === 'function') {
			logger.debug('reverting non-reverted `attachEvents` patch');
			proto.init = origInit;
			delete proto[H5PG_UI_ORIG_INIT_SYM];
		}
	}

	if (typeof playerSettings.hideControlsAfter !== 'number') {
		logger.debug('`hideControlsAfter` is not a number, skipping `UI.init` patch');
		return;
	}

	if (typeof proto.init !== 'function') {
		logger.error('`html5Player.UI.init` is not a function:', proto.init);
		return;
	}

	const origInit = (proto[H5PG_UI_ORIG_INIT_SYM] = proto.init).toString();
	const newInit = origInit.replace('5000', String(playerSettings.hideControlsAfter));

	logger.debug('replacing `init` with', newInit);

	waivedWindow.eval(`html5Player.UI.prototype.init = ${newInit}`);

	logger.debug('patched successfully');
};
