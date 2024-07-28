import { execa } from 'execa';
import { runGitCliff } from 'git-cliff';

import pkg from '../package.json' with { type: 'json' };

const newVersionTag = (
	await runGitCliff({ bumpedVersion: true }, { stdio: ['ignore', 'pipe', 'inherit'] })
).stdout;
const newVersion = newVersionTag.slice(1); // remove `v` prefix

if (pkg.version === newVersion) {
	console.info(`version ${pkg.version} is already actual`);
} else {
	console.info(`bumping from ${pkg.version} to ${newVersion}`);

	const msg = `chore(release): ${newVersionTag}`;

	await execa({
		stdout: 'inherit',
		stderr: 'inherit',
	})`pnpm version --sign-git-tag -m ${msg} ${newVersion}`;
}
