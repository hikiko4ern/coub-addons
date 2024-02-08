import { readFile } from 'fs/promises';

/** @returns {import('vite').Plugin} */
const vitePluginArrayBuffer = () => ({
	name: 'vite-plugin-arraybuffer',
	enforce: 'pre',
	async transform(_, id) {
		if (id.endsWith('?arraybuffer')) {
			return {
				code: `
					import { decode } from "base64-arraybuffer";
					export default decode("${(await readFile(id.slice(0, -12))).toString('base64')}");
				`,
				map: { mappings: '' },
			};
		}
	},
});

export default vitePluginArrayBuffer;
