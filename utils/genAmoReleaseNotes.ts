/**
 * @file generates release notes for AMO
 *
 * Usage:
 *
 * 1. generate for the latest version:
 * 		  pnpm -s tsx ./utils/genAmoReleaseNotes.ts
 *
 * 2. generate for a specific version:
 *      pnpm -s tsx ./utils/genAmoReleaseNotes.ts -v 0.1.26
 *
 * 3. generate for a specific version with a custom range:
 *      pnpm -s tsx ./utils/genAmoReleaseNotes.ts -v 0.1.26 --range v0.1.25..v0.1.26
 */

import { generateReleaseNotes } from './helpers/generateReleaseNotes';
import { printCode } from './helpers/printCode';
import { toAmoMarkdown } from './helpers/toAmoMarkdown';

const releaseNotes = toAmoMarkdown((await generateReleaseNotes()).mdTree);

await printCode(releaseNotes, 'markdown');
