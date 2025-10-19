import type { ConditionalKeys } from 'type-fest';

import type { Logger } from '@/utils/logger';

export const saveOriginalMethod = <
	Obj extends object,
	// biome-ignore lint/suspicious/noExplicitAny: required for correct types inference
	Key extends ConditionalKeys<NoInfer<Obj>, (...args: any[]) => any>,
>(
	logger: Logger,
	obj: Obj,
	key: Key,
	origSym: Extract<ConditionalKeys<NoInfer<Required<Obj>>, NoInfer<Obj[Key]>>, symbol>,
): Obj[Key] => {
	{
		const orig = obj[origSym];

		if (typeof orig === 'function') {
			logger.debug(`reverting non-reverted \`${key}\` patch`);
			obj[key] = orig;
			delete obj[origSym];
		}
	}

	return (obj[origSym] = obj[key] as unknown as (typeof obj)[typeof origSym]);
};
