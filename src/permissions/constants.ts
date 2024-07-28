import type { Permissions } from 'wxt/browser';

export const COMMENTS_GRAPHQL_HOST = `${import.meta.env?.VITE_COUB_COMMENTS_ORIGIN || process.env.VITE_COUB_COMMENTS_ORIGIN}/*`;

export const COMMENTS_GRAPHQL_PERMISSIONS: Permissions.Permissions = {
	origins: [COMMENTS_GRAPHQL_HOST],
};
