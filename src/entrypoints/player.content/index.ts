import { nanoid } from 'nanoid';
import type { Writable } from 'type-fest';
import type {} from 'typed-query-selector';

import { EventDispatcher } from '@/events';
import { applyPatches } from '@/helpers/patch/applyPatches';
import { PlayerSettingsStorage, type ReadonlyPlayerSettings } from '@/storage/playerSettings';
import { Logger } from '@/utils/logger';
import { onContentScriptUnload } from '@/utils/unloadHandler/onContentScriptUnload';
import { removeOldUnloadHandlers } from '@/utils/unloadHandler/removeOldUnloadHandlers';
import {
	CBC_GET_VIEWER_BLOCK_KEY,
	CBC_VIEWER_BLOCK_KEY_UP_EVENT,
	CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_KEY,
	patchCoubBlockClientside,
	revertCoubBlockClientsidePatches,
} from './patches/CoubBlockClientside';
import {
	H5PC_ATTACH_EVENTS_KEY,
	H5PC_CHANGE_STATE_KEY,
	H5PC_KEY_UP_EVENT,
	H5PC_KEY_UP_HANDLERS_KEY,
	patchHtml5PlayerClass,
	revertHtml5PlayerClassPatches,
} from './patches/Html5Player_class';
import {
	patchHtml5PlayerGlobal,
	revertHtml5PlayerGlobalPatches,
} from './patches/html5Player_global';
import { H5PG_UI_ORIG_INIT_KEY } from './patches/html5Player_global/constants';

const UNLOAD_HANDLERS_SUFFIX = 'player';

export default defineContentScript({
	matches: [`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/*`],
	excludeMatches: [
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/chat`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/chat/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/account/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/official/*`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/brand-assets`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/tos`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/privacy`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/rules`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/dmca`,
	],
	runAt: 'document_start',
	async main(ctx) {
		const ID = nanoid();
		const logger = Logger.create('player cs', { devUniqueId: ID });

		try {
			await removeOldUnloadHandlers(UNLOAD_HANDLERS_SUFFIX);
		} catch (err) {
			logger.error('failed to remove unload handlers:', err);
		}

		try {
			const tabId = await EventDispatcher.getTabId();
			const playerSettingsStorage = new PlayerSettingsStorage(tabId, 'player', logger);
			const mutablePlayerSettings: Writable<ReadonlyPlayerSettings> = {
				...(await playerSettingsStorage.getValue()),
			};

			const unwatchPlayerSettings = playerSettingsStorage.watch(newSettings =>
				Object.assign(mutablePlayerSettings, newSettings),
			);

			const waivedWindow = window.wrappedJSObject || window;

			const patches = applyPatches(
				logger,
				waivedWindow,
				{
					CoubBlockClientside: patchCoubBlockClientside,
					Html5Player: patchHtml5PlayerClass,
					html5Player: patchHtml5PlayerGlobal,
				},
				waivedWindow,
				mutablePlayerSettings,
			);

			const removeUnloadHandler = await onContentScriptUnload(
				UNLOAD_HANDLERS_SUFFIX,
				(
					loggerPrefix,
					// CoubBlockClientside
					cbcGetViewerBlockKey,
					cbcViewerBlockKeyUpEvent,
					cbcViewerBlockKeyUpHandlersKey,
					revertCoubBlockClientsidePatches,
					// Html5Player (class)
					h5pcAttachEventsKey,
					h5pcKeyUpEvent,
					h5pcKeyUpHandlersKey,
					h5pcChangeStateKey,
					revertHtml5PlayerClassPatches,
					// html5Player (global)
					h5pgUiOrigInitKey,
					revertHtml5PlayerGlobalPatches,
				) => {
					console.debug(`[${loggerPrefix}]`, 'reverting patches');

					revertCoubBlockClientsidePatches(
						cbcGetViewerBlockKey,
						cbcViewerBlockKeyUpEvent,
						cbcViewerBlockKeyUpHandlersKey,
						loggerPrefix,
					);

					revertHtml5PlayerClassPatches(
						h5pcAttachEventsKey,
						h5pcKeyUpEvent,
						h5pcKeyUpHandlersKey,
						h5pcChangeStateKey,
						loggerPrefix,
					);

					revertHtml5PlayerGlobalPatches(h5pgUiOrigInitKey, loggerPrefix);
				},
				logger.prefix,
				// CoubBlockClientside
				CBC_GET_VIEWER_BLOCK_KEY,
				CBC_VIEWER_BLOCK_KEY_UP_EVENT,
				CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_KEY,
				revertCoubBlockClientsidePatches,
				// Html5Player (class)
				H5PC_ATTACH_EVENTS_KEY,
				H5PC_KEY_UP_EVENT,
				H5PC_KEY_UP_HANDLERS_KEY,
				H5PC_CHANGE_STATE_KEY,
				revertHtml5PlayerClassPatches,
				// html5Player (global)
				H5PG_UI_ORIG_INIT_KEY,
				revertHtml5PlayerGlobalPatches,
			);

			ctx.onInvalidated(() => {
				unwatchPlayerSettings();
				removeUnloadHandler?.();

				for (const revert of patches) {
					revert?.();
				}
			});
		} catch (err) {
			logger.error('failed to apply patches:', err);
		}
	},
});
