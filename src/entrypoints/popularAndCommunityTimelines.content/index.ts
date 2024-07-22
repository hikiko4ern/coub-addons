import { nanoid } from 'nanoid';
import type {} from 'typed-query-selector';

import { isObject } from '@/helpers/isObject';
import { applyPatches } from '@/helpers/patch/applyPatches';
import { JST_TEMPLATE_NAMES } from '@/types/jst';
import { Logger } from '@/utils/logger';
import { onContentScriptUnload } from '@/utils/unloadHandler/onContentScriptUnload';
import { removeOldUnloadHandlers } from '@/utils/unloadHandler/removeOldUnloadHandlers';
import { JST_ORIGINAL_TEMPLATES_KEY, patchJst, revertJstPatches } from './patches/JST';

const UNLOAD_HANDLERS_SUFFIX = 'popularAndCommunityTimelines';

export default defineContentScript({
	matches: [
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/hot`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/rising`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/fresh`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/random`,
		`${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/community/*`,
	],
	runAt: 'document_start',
	async main(ctx) {
		const ID = nanoid();
		const logger = Logger.create('popular/community timelines cs', { devUniqueId: ID });

		try {
			await removeOldUnloadHandlers(UNLOAD_HANDLERS_SUFFIX);
		} catch (err) {
			logger.error('failed to remove unload handlers:', err);
		}

		try {
			const waivedWindow = window.wrappedJSObject || window;

			const patches = applyPatches(
				logger,
				waivedWindow,
				{
					JST: patchJst,
				},
				waivedWindow,
			);

			const removeUnloadHandler = await onContentScriptUnload(
				UNLOAD_HANDLERS_SUFFIX,
				(
					loggerPrefix,
					// helpers
					isObject,
					// JST
					jstTemplateNames,
					jstOriginalTemplatesKey,
					revertJstPatches,
				) => {
					console.debug(`[${loggerPrefix}]`, 'reverting patches');

					revertJstPatches(isObject, jstTemplateNames, jstOriginalTemplatesKey, loggerPrefix);
				},
				logger.prefix,
				// helpers
				isObject,
				// JST
				JST_TEMPLATE_NAMES,
				JST_ORIGINAL_TEMPLATES_KEY,
				revertJstPatches,
			);

			ctx.onInvalidated(() => {
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
