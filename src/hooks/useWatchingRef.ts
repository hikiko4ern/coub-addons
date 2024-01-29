import { type MutableRef, useRef } from 'preact/hooks';

export const useWatchingRef = <T>(value: T): Readonly<MutableRef<T>> => {
	const ref = useRef(value);
	ref.current = value;
	return ref;
};
