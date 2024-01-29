import { useEffect, useRef } from 'preact/hooks';

export const usePrevious = <T>(state: T): T | undefined => {
	const ref = useRef<T>();

	useEffect(() => {
		ref.current = state;
	});

	return ref.current;
};
