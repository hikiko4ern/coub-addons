export const isPromise = (value: unknown): value is Promise<unknown> =>
	!!value &&
	(typeof value === 'object' || typeof value === 'function') &&
	'then' in value &&
	typeof value.then === 'function';
