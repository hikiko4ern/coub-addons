import { Schema, defineConfig } from '@julr/vite-plugin-validate-env';

export default defineConfig({
	VITE_GECKO_ID: Schema.string(),
	VITE_GECKO_UPDATE_URL: Schema.string({ format: 'url', tld: false }),
	VITE_COUB_ORIGIN: Schema.string({ format: 'url' }),
	VITE_COUB_COMMENTS_ORIGIN: Schema.string({ format: 'url' }),
});
