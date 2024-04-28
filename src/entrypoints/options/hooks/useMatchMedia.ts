import { useEffect, useMemo, useState } from 'preact/hooks';

export const useMatchMedia = (query: string) => {
	const mediaQuery = useMemo(() => window.matchMedia(query), []);

	const [matches, setMatches] = useState(mediaQuery.matches);

	useEffect(() => {
		const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);

		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	}, []);

	return matches;
};
