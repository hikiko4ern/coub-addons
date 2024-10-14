import { isObject } from '@/helpers/isObject';
import type { Logger } from '@/utils/logger';
import { getJQuery } from '../getJQuery';
import type { GetGlobalsRes } from '../types';

export interface Html5PlayerGlobals {
	WeakMap: typeof window.WeakMap;
	WeakRef: typeof window.WeakRef;
	$: typeof window.$;
	Html5Player: typeof window.Html5Player;
}

export const getHtml5PlayerClassGlobals = (logger: Logger): GetGlobalsRes<Html5PlayerGlobals> => {
	const jqGlobal = getJQuery();

	if (!jqGlobal.isValid) {
		return jqGlobal;
	}

	const $ = jqGlobal.ret;
	const { WeakMap, WeakRef, Html5Player } = window.wrappedJSObject || window;

	if (typeof $ !== 'function') {
		return { isValid: false, ret: ['jQuery is not a function:', $] };
	}

	if (typeof Html5Player !== 'function' && !isObject(Html5Player)) {
		return {
			isValid: false,
			ret: ['`Html5Player` is not an object/function-like:', Html5Player],
		};
	}

	const proto = Html5Player.prototype;

	if (typeof proto?.attachEvents !== 'function') {
		return {
			isValid: false,
			ret: ['`Html5Player.prototype.attachEvents` is not a function:', proto?.attachEvents],
		};
	}

	if (typeof proto.toggleFavourites !== 'function') {
		logger.warn('`X.prototype.toggleFavourites` is not a function:', proto.toggleFavourites);
	}

	if (typeof proto.toggleFullScreen !== 'function') {
		logger.warn('`X.prototype.toggleFullScreen` is not a function:', proto.toggleFullScreen);
	}

	return { isValid: true, ret: { WeakMap, WeakRef, $, Html5Player } };
};
