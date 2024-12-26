import type { GetGlobalsRes } from '../types';

export interface ApplicationHelpersGlobals {
	moment: typeof window.moment;
	I18n: typeof window.I18n;
}

export const getApplicationHelpersGlobals = (): GetGlobalsRes<ApplicationHelpersGlobals> => {
	const { moment, I18n } = window.wrappedJSObject || window;

	if (typeof moment !== 'function') {
		return { isValid: false, ret: ['moment is not a function:', moment] };
	}

	if (typeof I18n !== 'object') {
		return { isValid: false, ret: ['`I18n` is not an object:', I18n] };
	}

	if (typeof I18n.t !== 'function') {
		return {
			isValid: false,
			ret: ['`I18n.t` is not a function:', I18n.t],
		};
	}

	return {
		isValid: true,
		ret: {
			moment,
			I18n,
		},
	};
};
