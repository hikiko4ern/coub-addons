export const sleep = (ms: number, signal?: AbortSignal) =>
	new Promise<void>((res, rej) => {
		const abortHandler = () => {
			rej(signal ? signal.reason : `Timed out after ${ms}ms`);
			clearTimeout(id);
		};

		const id = setTimeout(() => {
			res();
			signal?.removeEventListener('abort', abortHandler);
		}, ms);

		signal?.addEventListener('abort', abortHandler);
	});

export const withTimeout = <T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> =>
	new Promise((res, rej) => {
		const signal = AbortSignal.timeout(ms);
		const promise = fn(signal);

		const abortHandler = () => rej(signal.reason);

		signal.addEventListener('abort', abortHandler);
		promise.then(res, rej).finally(() => signal.removeEventListener('abort', abortHandler));
	});

export const pluralize = (count: number, word: string, pluralForm?: string) =>
	count === 1 ? `${count} ${word}` : `${count} ${pluralForm ?? `${word}s`}`;
