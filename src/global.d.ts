/// <reference types="vite/client" />
/// <reference types="vitest/import-meta" />

type ImportMetaEnvAugmented = import('@julr/vite-plugin-validate-env').ImportMetaEnvAugmented<
	typeof import('../env').default
>;

interface ImportMetaEnv extends ImportMetaEnvAugmented {}

namespace NodeJS {
	interface ProcessEnv extends ImportMetaEnvAugmented {}
}

declare module '*?arraybuffer' {
	const value: ArrayBuffer;
	export default value;
}
