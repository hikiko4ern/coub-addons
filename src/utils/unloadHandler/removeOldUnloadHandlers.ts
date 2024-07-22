import { nanoid } from 'nanoid';

import { EventDispatcher } from '@/events';

const ID = nanoid();
const logger = Logger.create('removeOldUnloadHandlers', { devUniqueId: ID });

export const removeOldUnloadHandlers = async (classSuffix: string) => {
	const classes = await EventDispatcher.getUnloadStylesClassWithPrefix();

	if (classes) {
		const [unloadStylesClassPrefix, unloadStylesClass] = classes;
		const actualClass = `${unloadStylesClassPrefix}__${classSuffix}`;

		logger.debug('removing old', classSuffix, 'handlers', {
			prefix: unloadStylesClassPrefix,
			actualClass,
		});

		for (const span of document.querySelectorAll(
			`[class^="${CSS.escape(actualClass)}"]:not(.${CSS.escape(unloadStylesClass)})`,
		)) {
			span.remove();
		}
	}
};
