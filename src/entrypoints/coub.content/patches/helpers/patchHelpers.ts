import { isObject } from '@/helpers/isObject';
import { type RevertPatch, applyPatches } from '@/helpers/patch/applyPatches';
import { patchMethod } from '@/helpers/patch/patchMethod';
import type { Logger } from '@/utils/logger';

import {
	APPLICATION_ORIGINAL_SMART_DATE_TIME_KEY,
	APPLICATION_ORIGINAL_SMART_DATE_TIME_SYM,
} from './constants';
import { getApplicationHelpersGlobals } from './getApplicationHelpersGlobals';
import { revertHelpersPatches } from './revertHelpersPatches';

type xApplicationPatches = {
	[key in typeof APPLICATION_ORIGINAL_SMART_DATE_TIME_SYM]?: coub.helpers.Application['smartDateTime'];
};

declare global {
	namespace coub {
		namespace helpers {
			interface ApplicationPatches extends xApplicationPatches {}
		}
	}
}

export function patchHelpers(
	parentLogger: Logger,
	waivedWindow: typeof window,
): RevertPatch | unknown[] {
	const logger = parentLogger.getChildLogger('helpers');

	const helpers = waivedWindow.helpers;

	const patches = applyPatches(
		logger,
		helpers,
		{
			Application: patchApplication,
		},
		waivedWindow,
	);

	logger.debug('patched successfully');

	return () => {
		using rmLogger = logger.scopedGroupAuto('removing patches');

		for (const revert of patches) {
			revert?.();
		}

		revertHelpersPatches(
			APPLICATION_ORIGINAL_SMART_DATE_TIME_KEY,
			undefined,
			rmLogger,
			waivedWindow.helpers,
		);
	};
}

const patchApplication = (parentLogger: Logger, waivedWindow: typeof window) => {
	const validatedGlobals = getApplicationHelpersGlobals();

	if (!validatedGlobals.isValid) {
		return validatedGlobals.ret;
	}

	const logger = parentLogger.getChildLogger('Application');
	const { moment, I18n } = validatedGlobals.ret;
	const Application = waivedWindow.helpers.Application;

	const smartDateTimeLogger = logger.getChildLogger('smartDateTime');

	patchMethod(
		logger,
		Application,
		'smartDateTime',
		APPLICATION_ORIGINAL_SMART_DATE_TIME_SYM,
		function patchedSmartDateTime(origSmartDateTime, ...args) {
			using logger = smartDateTimeLogger.scopedGroupAuto('called with', [...args]);

			const [object, _ago, dateProperty = 'created_at'] = args;

			if (
				isObject(object) &&
				typeof dateProperty === 'string' &&
				dateProperty in object &&
				typeof object[dateProperty as keyof typeof object] === 'string'
			) {
				try {
					const rawDate = object[dateProperty as keyof typeof object] as string,
						now = new Date(),
						date = moment(rawDate),
						dateYear = date.year();

					logger.debug('created date', date);

					if (
						dateYear !== now.getFullYear() &&
						// Coub currently uses the “current year” format only if more than 72 hours have passed between dates
						Math.abs(date.diff(cloneInto(now, date), 'hours')) >= 72
					) {
						return I18n.t(
							'smart_datetime_new.year_ago',
							cloneInto(
								{
									day: date.date(),
									month: I18n.t('smart_datetime_new.month_names')[date.month()],
									year: dateYear,
								},
								I18n,
							),
						);
					}
				} catch (err) {
					logger.error('failed to format date, falling back to the provided implementation', err);
				}
			}

			return Reflect.apply(origSmartDateTime, this, args);
		},
	);

	logger.debug('patched successfully');
};
