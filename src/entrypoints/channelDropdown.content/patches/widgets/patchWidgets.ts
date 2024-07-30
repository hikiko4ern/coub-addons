import { isObject } from '@/helpers/isObject';
import { type RevertPatch, applyPatches } from '@/helpers/patch/applyPatches';
import type { createAddChannelBlockButton } from '@/js/createAddChannelBlockButton';
import type { Logger } from '@/utils/logger';

import { CD_ADDED_NODES_KEY } from '../../constants';
import { addBlockButtonToChannelDropdown } from '../../helpers/addBlockButtonToChannelDropdown';
import type { ChannelDropdownAddedNodes } from '../../types';
import {
	CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_KEY,
	CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_SYM,
} from './constants';
import { revertWidgetsPatches } from './revertWidgetsPatches';

type Patches = {
	[key in typeof CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_SYM]?: coub.widgets.ChannelDropdown['setDropdownContent'];
};

declare global {
	namespace coub {
		namespace widgets {
			interface ChannelDropdownPatches extends Patches {}
		}
	}
}

export function patchWidgets(
	parentLogger: Logger,
	waivedWindow: typeof window,
	addedNodes: ChannelDropdownAddedNodes,
	addChannelBlockButton: ReturnType<typeof createAddChannelBlockButton>,
): RevertPatch | unknown[] {
	const logger = parentLogger.getChildLogger('widgets');

	const widgets = waivedWindow.widgets;

	const patches = applyPatches(
		logger,
		widgets,
		{
			ChannelDropdown: patchChannelDropdown,
		},
		waivedWindow,
		addedNodes,
		addChannelBlockButton,
	);

	logger.debug('patched successfully');

	return () => {
		logger.debug('removing patches');

		for (const revert of patches) {
			revert?.();
		}

		revertWidgetsPatches(
			isObject,
			CD_ADDED_NODES_KEY,
			CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_KEY,
			undefined,
			logger,
			waivedWindow.widgets,
		);
	};
}

const patchChannelDropdown = (
	parentLogger: Logger,
	waivedWindow: typeof window,
	addedNodes: ChannelDropdownAddedNodes,
	addChannelBlockButton: ReturnType<typeof createAddChannelBlockButton>,
) => {
	const logger = parentLogger.getChildLogger('ChannelDropdown');
	const proto = waivedWindow.widgets.ChannelDropdown.prototype;

	const addContent = addBlockButtonToChannelDropdown.bind(
		undefined,
		logger,
		addedNodes,
		addChannelBlockButton,
	);

	const origSetDropdownContent = (proto[CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_SYM] =
		proto.setDropdownContent);

	const patchedSetDropdownContent: typeof proto.setDropdownContent = function patchedTemplate(
		...args
	) {
		const channelDropdown = this.wrappedJSObject || this;
		const res = Reflect.apply(origSetDropdownContent, channelDropdown, args);

		logger.debug('adding content to channel dropdown', { channelDropdown });

		try {
			const content = channelDropdown.dropdown?.content[0];
			content && addContent(content, channelDropdown.data?.get('fullChannelData')?.id);
		} catch (err) {
			logger.error('failed to patch content:', err);
		}

		return res;
	};

	exportFunction(patchedSetDropdownContent, proto, { defineAs: 'setDropdownContent' });

	logger.debug('patched successfully');
};
