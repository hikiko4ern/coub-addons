import { Schema, defineConfig } from '@julr/vite-plugin-validate-env';

export default defineConfig({
	VITE_GECKO_ID: Schema.string(),
	VITE_COUB_ORIGIN: Schema.string({ format: 'url' }),
});
