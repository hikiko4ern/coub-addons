import { isObject } from '@/helpers/isObject';
import { type RevertPatch, applyPatches } from '@/helpers/patch/applyPatches';
import { JST_TEMPLATE_NAMES, JstTemplateName } from '@/types/jst';
import type { Logger } from '@/utils/logger';

import { JST_ORIGINAL_TEMPLATES_KEY, JST_ORIGINAL_TEMPLATES_SYM } from './constants';
import { revertJstPatches } from './revertJstPatches';

type OriginalTemplates = Partial<Record<JstTemplateName, coub.JstTemplate>>;

type Patches = {
	[key in typeof JST_ORIGINAL_TEMPLATES_SYM]?: OriginalTemplates;
};

declare global {
	namespace coub {
		interface JstPatches extends Patches {}
	}
}

export function patchJst(
	parentLogger: Logger,
	waivedWindow: typeof window,
): RevertPatch | unknown[] {
	const logger = parentLogger.getChildLogger('JST');

	const JST = waivedWindow.JST;

	const origTemplates = (waivedWindow.JST[JST_ORIGINAL_TEMPLATES_SYM] ||=
		cloneInto<OriginalTemplates>({}, waivedWindow.JST));

	for (const name of JST_TEMPLATE_NAMES) {
		const origTemplate = origTemplates[name];

		if (typeof origTemplate === 'function') {
			logger.debug('reverting non-reverted', name, 'patch');
			waivedWindow.JST[name] = origTemplate;
			delete origTemplates[name];
		}
	}

	const patches = applyPatches(
		logger,
		JST,
		{
			[JstTemplateName.TIMELINE_LIST]: patchTimelineList,
		},
		waivedWindow,
		origTemplates,
	);

	logger.debug('patched successfully');

	return () => {
		logger.debug('removing patches');

		for (const revert of patches) {
			revert?.();
		}

		revertJstPatches(
			isObject,
			JST_TEMPLATE_NAMES,
			JST_ORIGINAL_TEMPLATES_KEY,
			undefined,
			logger,
			waivedWindow.JST,
		);
	};
}

const patchTimelineList = (
	parentLogger: Logger,
	waivedWindow: typeof window,
	origTemplates: OriginalTemplates,
) => {
	const name = JstTemplateName.TIMELINE_LIST;
	const logger = parentLogger.getChildLogger(name);

	const origTemplate = (origTemplates[name] =
		// biome-ignore lint/style/noNonNullAssertion: the patch is applied only if the template has been declared
		waivedWindow.JST[name]!);

	const patchedTemplate: coub.JstTemplate = function patchedTemplate(...args) {
		logger.debug('called with', [...args]);

		if (
			isObject(args[0]) &&
			'render-no-date' in args[0] &&
			args[0]['render-no-date'] === 'hidden'
		) {
			const { 'render-no-date': _, ...rest } = args[0];
			args[0] = cloneInto(rest, waivedWindow.JST[name]);
		}

		return Reflect.apply(origTemplate, this, args);
	};

	exportFunction(patchedTemplate, waivedWindow.JST, { defineAs: name });
};
