import fs from 'node:fs/promises';
import path from 'node:path';
import { visit } from 'unist-util-visit';
import { defineWxtModule } from 'wxt/modules';
import { fromXml } from 'xast-util-from-xml';
import { toXml } from 'xast-util-to-xml';

import pkg from '../package.json' with { type: 'json' };

const GRAYSCALE_FILTER = 'grayscale(1)';

const svgIconModule = defineWxtModule({
	name: pkg.name,
	configKey: 'svgIcon',
	async setup(wxt, options) {
		/** @type {Required<import('./index').SvgIconOptions>} */
		const parsedOptions = {
			enabled: true,
			baseIconPath: path.resolve(wxt.config.srcDir, 'assets/icon.svg'),
			...options,
		};

		const isGrayscale = wxt.config.mode === 'development';
		const resolvedPath = path.resolve(wxt.config.srcDir, parsedOptions.baseIconPath);

		if (!parsedOptions.enabled) {
			return wxt.logger.warn(`\`[${this.name}]\` disabled`);
		}

		/** @type {string} */
		let icon,
			isIconGrayscaled = false;

		try {
			icon = await fs.readFile(resolvedPath, { encoding: 'utf8' });
		} catch (err) {
			return wxt.logger.error(
				`\`[${this.name}]\` failed to read ${path.relative(process.cwd(), resolvedPath)}: ${err}`,
			);
		}

		wxt.hooks.hook('prepare:publicPaths', (_, paths) => {
			paths.push('icon.svg');
		});

		wxt.hooks.hook('build:manifestGenerated', (wxt, manifest) => {
			if (manifest.icons) {
				wxt.logger.warn(
					`\`[${this.name}]\` icons property found in manifest, overwriting with auto-generated icons`,
				);
			}

			manifest.icons = {
				16: '/icon.svg',
				32: '/icon.svg',
				48: '/icon.svg',
				96: '/icon.svg',
				128: '/icon.svg',
			};
		});

		wxt.hooks.hook('build:done', async (wxt, output) => {
			if (isGrayscale && !isIconGrayscaled) {
				const parsed = fromXml(icon);

				visit(parsed, { type: 'element', name: 'svg' }, _node => {
					const node = /** @type {import('xast').Element} */ (_node);
					const filter = node.attributes.filter;
					node.attributes.filter = filter ? `${filter} ${GRAYSCALE_FILTER}` : GRAYSCALE_FILTER;
				});

				icon = toXml(parsed);
				isIconGrayscaled = true;
			}

			const outputFolder = wxt.config.outDir;

			await fs.writeFile(path.resolve(outputFolder, 'icon.svg'), icon, { encoding: 'utf8' });

			output.publicAssets.push({ type: 'asset', fileName: 'icon.svg' });
		});
	},
});

export default svgIconModule;
