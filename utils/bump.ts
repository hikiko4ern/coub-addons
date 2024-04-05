import { $ } from 'bun';

import pkg from '../package.json';

const newVersionTag = await $`bun git-cliff --bumped-version`.text();
const newVersion = newVersionTag.slice(1); // remove `v` prefix

if (pkg.version === newVersion) {
	console.info(`version ${pkg.version} is already actual`);
} else {
	console.info(`bumping from ${pkg.version} to ${newVersion}`);
	await $`npm version --sign-git-tag -m "chore(release): ${newVersionTag}" ${newVersion}`;
}
