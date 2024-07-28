import { nanoid } from 'nanoid';

import { EventDispatcher } from '@/events';

const ID = nanoid();
const logger = Logger.create('removeOldUnloadHandlers', { devUniqueId: ID });

export const removeOldUnloadHandlers = async (type: string) => {
	const classes = await EventDispatcher.getUnloadStylesClassWithPrefix();

	if (classes) {
		const [unloadStylesClassPrefix, unloadStylesClass] = classes;

		const oldHandlers = document.querySelectorAll(
			`[class^="${CSS.escape(unloadStylesClassPrefix)}"][data-type="${type}"]:not(.${CSS.escape(unloadStylesClass)})`,
		);

		logger.debug('removing old', type, 'handlers', {
			prefix: unloadStylesClassPrefix,
			newClass: unloadStylesClass,
			handlers: oldHandlers,
		});

		for (const span of oldHandlers) {
			span.remove();
		}
	}
};
