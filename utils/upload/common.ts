import fs from 'node:fs/promises';
import path from 'node:path';
import { SupportedLocale } from '@coub-addons/publish-extension';
import { codeToANSI } from '@shikijs/cli';
import type { Entries } from 'type-fest';

import { version } from '../../package.json' with { type: 'json' };
import { ROOT_PATH } from '../_common.js';
import { generateExtensionDescription } from '../generateExtensionDescription';
import { RELEASE_NOTES_DIR } from './init-common';

type ReadmeFileNames = {
	[locale in SupportedLocale]: locale extends SupportedLocale.EN_US
		? 'README.md'
		: `README.${locale}.md`;
};

const README_FILE_NAMES: ReadmeFileNames = {
	[SupportedLocale.EN_US]: 'README.md',
	[SupportedLocale.RU]: 'README.ru.md',
};

const releaseNotes = await fs.readFile(path.join(RELEASE_NOTES_DIR, `${version}.html`), {
	encoding: 'utf8',
});

const description: Record<SupportedLocale, string> = {} as never;

for (const [locale, fileName] of Object.entries(README_FILE_NAMES) as Entries<
	typeof README_FILE_NAMES
>) {
	const html = generateExtensionDescription(
		await fs.readFile(path.join(ROOT_PATH, fileName), { encoding: 'utf8' }),
	);

	console.log(`----- [${locale}] description -----\n`);
	console.log(await codeToANSI(html, 'html', 'ayu-dark'));

	description[locale] = html;
}

export const dryRun = process.env.DRY_RUN !== '0';

export { description, releaseNotes };
