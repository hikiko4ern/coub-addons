import { EventListener } from '@/events';
import { Logger } from '@/utils/logger';

const logger = Logger.create('l10n/listener');

export const setupL10nLocaleListener = (setLocales: (locales: string[]) => void) =>
	new EventListener(logger, e => {
		switch (e.type) {
			case 'I18nLocaleEvent': {
				const { locale } = e;
				try {
					logger.debug('changing locale to', locale);
					setLocales([locale]);
				} catch (err) {
					logger.error('failed to change locale to', locale, err);
				}
				break;
			}
		}
	});
