export const getStoryPermalink = (permalink: string) =>
	new URL(`/stories/${permalink}`, import.meta.env.VITE_COUB_ORIGIN);
