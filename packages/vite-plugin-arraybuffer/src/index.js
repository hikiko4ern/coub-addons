import fs from 'node:fs/promises';

/** @type {() => import('vite').Plugin} */
const vitePluginArrayBuffer = () => ({
	name: 'vite-plugin-arraybuffer',
	enforce: 'pre',
	async transform(_, id) {
		if (id.endsWith('?arraybuffer')) {
			const base64 = await fs.readFile(id.slice(0, -12), { encoding: 'base64' });

			return {
				code: `
						import { decode } from "base64-arraybuffer";
						export default decode("${base64}");
					`,
				map: { mappings: '' },
			};
		}
	},
});

export default vitePluginArrayBuffer;
