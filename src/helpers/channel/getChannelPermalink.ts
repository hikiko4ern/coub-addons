export const getChannelPermalink = (permalink: string) =>
	new URL(`/${permalink}`, import.meta.env.VITE_COUB_ORIGIN);
