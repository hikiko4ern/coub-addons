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
	H5P_ATTACH_EVENTS_KEY,
	H5P_CHANGE_STATE_KEY,
	H5P_KEY_UP_EVENT,
	H5P_KEY_UP_HANDLERS_KEY,
	patchHtml5Player,
	revertHtml5PlayerPatches,
} from './patches/Html5Player';
import {
	APPLICATION_ORIGINAL_SMART_DATE_TIME_KEY,
	patchHelpers,
	revertHelpersPatches,
} from './patches/helpers';

const UNLOAD_HANDLERS_SUFFIX = 'coub';

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
		const logger = Logger.create('coub cs', { devUniqueId: ID });

		try {
			await removeOldUnloadHandlers(UNLOAD_HANDLERS_SUFFIX);
		} catch (err) {
			logger.error('failed to remove unload handlers:', err);
		}

		try {
			const tabId = await EventDispatcher.getTabId();
			const playerSettingsStorage = new PlayerSettingsStorage(tabId, 'coub', logger);
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
					Html5Player: patchHtml5Player,
					helpers: patchHelpers,
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
					// Html5Player
					h5pAttachEventsKey,
					h5pKeyUpEvent,
					h5pKeyUpHandlersKey,
					h5pChangeStateKey,
					revertHtml5PlayerPatches,
					// helpers
					applicationOriginalSmartDateTimeKey,
					revertHelpersPatches,
				) => {
					console.debug(`[${loggerPrefix}]`, 'reverting patches');

					revertCoubBlockClientsidePatches(
						cbcGetViewerBlockKey,
						cbcViewerBlockKeyUpEvent,
						cbcViewerBlockKeyUpHandlersKey,
						loggerPrefix,
					);

					revertHtml5PlayerPatches(
						h5pAttachEventsKey,
						h5pKeyUpEvent,
						h5pKeyUpHandlersKey,
						h5pChangeStateKey,
						loggerPrefix,
					);

					revertHelpersPatches(applicationOriginalSmartDateTimeKey, loggerPrefix);
				},
				logger.prefix,
				// CoubBlockClientside
				CBC_GET_VIEWER_BLOCK_KEY,
				CBC_VIEWER_BLOCK_KEY_UP_EVENT,
				CBC_VIEWER_BLOCK_KEY_UP_HANDLERS_KEY,
				revertCoubBlockClientsidePatches,
				// Html5Player
				H5P_ATTACH_EVENTS_KEY,
				H5P_KEY_UP_EVENT,
				H5P_KEY_UP_HANDLERS_KEY,
				H5P_CHANGE_STATE_KEY,
				revertHtml5PlayerPatches,
				// helpers
				APPLICATION_ORIGINAL_SMART_DATE_TIME_KEY,
				revertHelpersPatches,
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
