import { type ParseArgsOptionsConfig, parseArgs } from 'node:util';
import { execa } from 'execa';
import { runGitCliff } from 'git-cliff';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { remove } from 'unist-util-remove';

import pkg from '../../package.json' with { type: 'json' };

export const releaseNotesArgs = {
	version: {
		type: 'string',
		short: 'v',
		default: pkg.version,
	},
	range: {
		type: 'string',
	},
} satisfies ParseArgsOptionsConfig;

/** generates addon's version release notes for AMO */
export async function generateReleaseNotes() {
	let {
		values: { version, range, files: _ },
	} = parseArgs({
		options: releaseNotesArgs,
		strict: false,
	});

	if (!version || typeof version === 'boolean') {
		throw new RangeError(`\`--version\` is required, got \`${JSON.stringify(version)}\``);
	}

	if (!range || typeof range === 'boolean') {
		const prevTag = (
			await execa({
				stdio: ['ignore', 'pipe', 'inherit'],
			})`git describe --tags --abbrev=0 v${version}^`
		).stdout.trim();

		if (!prevTag) {
			throw new Error(`Failed to get previous for ${version} version`);
		}

		range = `${prevTag}..v${version}`;
	}

	const newVersionMarkdown = (await runGitCliff([range], { stdio: ['ignore', 'pipe', 'inherit'] }))
		.stdout;

	const mdTree = fromMarkdown(newVersionMarkdown);

	remove(mdTree, [
		{ type: 'heading', depth: 1 },
		{ type: 'heading', depth: 2 },
	]);

	return {
		mdTree,
		range,
	};
}
