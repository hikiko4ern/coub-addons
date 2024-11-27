import type { Permissions } from 'wxt/browser';

export const COUB_HOST = `${import.meta.env?.VITE_COUB_ORIGIN || process.env.VITE_COUB_ORIGIN}/*`;

export const COMMENTS_GRAPHQL_HOST = `${import.meta.env?.VITE_COUB_COMMENTS_ORIGIN || process.env.VITE_COUB_COMMENTS_ORIGIN}/*`;

export const ARE_COMMENTS_ON_DIFFERENT_HOST = COMMENTS_GRAPHQL_HOST !== COUB_HOST;

export const COMMENTS_GRAPHQL_PERMISSIONS: Permissions.Permissions = {
	origins: [COMMENTS_GRAPHQL_HOST],
};
