import { nanoid } from 'nanoid';
import type { Writable } from 'type-fest';
import type {} from 'typed-query-selector';

import { EventDispatcher } from '@/events';
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
	H5P_KEY_UP_EVENT,
	H5P_KEY_UP_HANDLERS_KEY,
	patchHtml5Player,
	revertHtml5PlayerPatches,
} from './patches/Html5Player';
import type { RevertPatch } from './types';

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
		const logger = Logger.create('keyboard shortcuts cs', { devUniqueId: ID });

		try {
			await removeOldUnloadHandlers();
		} catch (err) {
			logger.error('failed to remove unload handlers:', err);
		}

		try {
			const tabId = await EventDispatcher.getTabId();
			const playerSettingsStorage = new PlayerSettingsStorage(tabId, 'keyboard shortcuts', logger);
			const mutablePlayerSettings: Writable<ReadonlyPlayerSettings> = {
				...(await playerSettingsStorage.getValue()),
			};

			const unwatchPlayerSettings = playerSettingsStorage.watch(newSettings =>
				Object.assign(mutablePlayerSettings, newSettings),
			);

			const waivedWindow = window.wrappedJSObject || window;

			const patchers = {
				CoubBlockClientside: patchCoubBlockClientside,
				Html5Player: patchHtml5Player,
			} as const;

			const patches = Object.entries(patchers).reduce<(RevertPatch | undefined)[]>(
				(patches, [_key, patch]) => {
					const key = _key as keyof typeof patchers;
					const index = patches.push(undefined) - 1;

					const apply = () => {
						const maybeRevert = patch(logger, mutablePlayerSettings);

						if (typeof maybeRevert === 'function') {
							patches[index] = maybeRevert;
						} else {
							logger.error(`failed to patch ${key}:`, ...maybeRevert);
						}
					};

					// class is already loaded, apply patch immediately
					if (waivedWindow[key]) {
						apply();
					}
					// class is not loaded, wait
					else {
						logger.debug('waiting for', key, 'initialization...');

						Reflect.defineProperty(waivedWindow, key, {
							configurable: true,
							enumerable: true,
							get: exportFunction(() => {}, window),
							set: exportFunction(v => {
								logger.debug(key, 'is initialized, patching...');

								Reflect.defineProperty(waivedWindow, key, {
									configurable: true,
									enumerable: true,
									writable: true,
									value: v,
								});

								apply();
							}, window),
						});

						patches[index] = () => {
							Reflect.defineProperty(waivedWindow, key, {
								configurable: true,
								enumerable: true,
								writable: true,
								value: undefined,
							});
						};
					}

					return patches;
				},
				[],
			);

			const removeUnloadHandler = await onContentScriptUnload(
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
					revertHtml5PlayerPatches,
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
						loggerPrefix,
					);
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
				revertHtml5PlayerPatches,
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
