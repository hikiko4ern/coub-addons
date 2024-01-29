import { nanoid } from 'nanoid';

import { Logger } from '../utils/logger';

const ID = nanoid();
const logger = Logger.create('siteLocale', { devUniqueId: ID });

export const locale = (() => {
	try {
		const window = globalThis.window.wrappedJSObject || globalThis.window;
		logger.info('i18n:', window.I18n);
		return window.I18n.locale;
	} catch (err) {
		logger.error('failed to get I18n.locale:', err);
	}
})();
