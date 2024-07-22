import type { OmitIndexSignature } from 'type-fest';

import type { Logger } from '@/utils/logger';

export type RevertPatch = () => void;

type Patchers<T extends object, Args extends unknown[]> = {
	readonly [key in keyof OmitIndexSignature<T>]?: (
		logger: Logger,
		...args: Args
	) => RevertPatch | unknown[] | void;
};

export const applyPatches = <T extends object, Args extends unknown[]>(
	logger: Logger,
	target: T,
	patchers: Patchers<T, Args>,
	...args: Args
) => {
	type Patchers = typeof patchers;
	type PatchersKey = keyof Patchers;

	return (Object.entries(patchers) as [PatchersKey, NonNullable<Patchers[PatchersKey]>][]).reduce<
		(RevertPatch | undefined)[]
	>((patches, [key, patch]) => {
		const index = patches.push(undefined) - 1;

		const apply = () => {
			const maybeRevert = patch(logger, ...args);

			if (!maybeRevert || typeof maybeRevert === 'function') {
				patches[index] = maybeRevert as Exclude<typeof maybeRevert, void> | undefined;
			} else {
				logger.error('failed to patch', key, ...maybeRevert);
			}
		};

		// object is already loaded, apply patch immediately
		if (target[key]) {
			apply();
		}
		// object is not loaded, wait
		else {
			logger.debug('waiting for', key, 'initialization...');

			Reflect.defineProperty(target, key, {
				configurable: true,
				enumerable: true,
				get: exportFunction(() => {}, window),
				set: exportFunction(v => {
					logger.debug(key, 'is initialized, patching...');

					Reflect.defineProperty(target, key, {
						configurable: true,
						enumerable: true,
						writable: true,
						value: v,
					});

					apply();
				}, window),
			});

			patches[index] = () => {
				Reflect.defineProperty(target, key, {
					configurable: true,
					enumerable: true,
					writable: true,
					value: undefined,
				});
			};
		}

		return patches;
	}, []);
};
