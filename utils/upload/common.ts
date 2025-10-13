import fs from 'node:fs/promises';
import path from 'node:path';
import { SupportedLocale } from '@coub-addons/publish-extension';
import { codeToANSI } from '@shikijs/cli';
import type { Entries } from 'type-fest';

import { ROOT_PATH } from '../_common.js';
import { generateExtensionDescription } from '../helpers/generateExtensionDescription';
import { generateReleaseNotes } from '../helpers/generateReleaseNotes';
import { toAmoMarkdown } from '../helpers/toAmoMarkdown';

type ReadmeFileNames = {
	[locale in SupportedLocale]: locale extends SupportedLocale.EN_US
		? 'README.md'
		: `README.${locale}.md`;
};

const README_FILE_NAMES: ReadmeFileNames = {
	[SupportedLocale.EN_US]: 'README.md',
	[SupportedLocale.RU]: 'README.ru.md',
};

const releaseNotes = toAmoMarkdown((await generateReleaseNotes()).mdTree);

console.log('----- release notes -----\n');
console.log(await codeToANSI(releaseNotes, 'markdown', 'ayu-dark'));

const description: Record<SupportedLocale, string> = {} as never;

for (const [locale, fileName] of Object.entries(README_FILE_NAMES) as Entries<
	typeof README_FILE_NAMES
>) {
	const md = generateExtensionDescription(
		await fs.readFile(path.join(ROOT_PATH, fileName), { encoding: 'utf8' }),
	);

	console.log(`----- [${locale}] description -----\n`);
	console.log(await codeToANSI(md, 'markdown', 'ayu-dark'));

	description[locale] = md;
}

export const dryRun = process.env.DRY_RUN !== '0';

export { description, releaseNotes };
