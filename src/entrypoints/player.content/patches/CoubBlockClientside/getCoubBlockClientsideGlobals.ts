import { isObject } from '@/helpers/isObject';
import { getJQuery } from '../getJQuery';
import type { GetGlobalsRes } from '../types';

export interface CoubBlockClientsideGlobals {
	WeakRef: typeof window.WeakRef;
	$: typeof window.$;
	CoubBlockClientside: typeof window.CoubBlockClientside;
}

export const getCoubBlockClientsideGlobals = (): GetGlobalsRes<CoubBlockClientsideGlobals> => {
	const jqGlobal = getJQuery();

	if (!jqGlobal.isValid) {
		return jqGlobal;
	}

	const $ = jqGlobal.ret;
	const { WeakRef, CoubBlockClientside } = window.wrappedJSObject || window;

	if (typeof $ !== 'function') {
		return { isValid: false, ret: ['jQuery is not a function:', $] };
	}

	if (typeof CoubBlockClientside !== 'function' && !isObject(CoubBlockClientside)) {
		return {
			isValid: false,
			ret: ['`CoubBlockClientside` is not an object/function-like:', CoubBlockClientside],
		};
	}

	const proto = CoubBlockClientside.prototype;

	if (typeof proto?.getViewerBlock !== 'function') {
		return {
			isValid: false,
			ret: [
				'`CoubBlockClientside.prototype.getViewerBlock` is not a function:',
				proto?.getViewerBlock,
			],
		};
	}

	return {
		isValid: true,
		ret: {
			WeakRef,
			$,
			CoubBlockClientside,
		},
	};
};
