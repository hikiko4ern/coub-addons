import type { GetGlobalsRes } from './types';

export const getJQuery = (): GetGlobalsRes<typeof $> => {
	const { $ } = window.wrappedJSObject || window;

	return typeof $ === 'function'
		? { isValid: true, ret: $ }
		: { isValid: false, ret: ['jQuery is not a function:', $] };
};
