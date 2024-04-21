import { nanoid } from 'nanoid';

import { EventDispatcher } from '@/events';

const ID = nanoid();
const logger = Logger.create('removeOldUnloadHandlers', { devUniqueId: ID });

export const removeOldUnloadHandlers = async () => {
	const classes = await EventDispatcher.getUnloadStylesClassWithPrefix();

	if (classes) {
		const [unloadStylesClassPrefix, unloadStylesClass] = classes;

		logger.debug('removing old handlers', {
			prefix: unloadStylesClassPrefix,
			actualClass: unloadStylesClass,
		});

		for (const span of document.querySelectorAll(
			`[class^="${CSS.escape(unloadStylesClassPrefix)}"]:not(.${CSS.escape(unloadStylesClass)})`,
		)) {
			span.remove();
		}
	}
};
