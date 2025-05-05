import type { ConditionalKeys } from 'type-fest';

import type { Logger } from '@/utils/logger';

import { saveOriginalMethod } from './saveOriginalMethod';

export const patchMethod = <
	Obj extends object,
	Key extends ConditionalKeys<NoInfer<Obj>, (...args: any[]) => any>,
>(
	logger: Logger,
	obj: Obj,
	key: Key,
	origSym: Extract<ConditionalKeys<NoInfer<Required<Obj>>, NoInfer<Obj[Key]>>, symbol>,
	patchedMethod: (
		this: ThisParameterType<NoInfer<Obj[Key]>>,
		origMethod: NoInfer<Obj[Key]>,
		...args: Parameters<NoInfer<Obj[Key]>>
	) => ReturnType<NoInfer<Obj[Key]>>,
) => {
	const origMethod = saveOriginalMethod(logger, obj, key, origSym);

	const patchedWrapper = function patchedWrapper(
		this: ThisParameterType<Obj[Key]>,
		...args: Parameters<Obj[Key]>
	) {
		return Reflect.apply(patchedMethod, this, [origMethod, ...args]);
	};

	exportFunction(patchedWrapper, obj, { defineAs: key });
};
