export const getCoubPermalink = (permalink: string) =>
	new URL(`/view/${permalink}`, import.meta.env.VITE_COUB_ORIGIN);
