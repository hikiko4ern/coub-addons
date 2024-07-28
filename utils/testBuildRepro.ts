import crypto from 'node:crypto';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { text } from 'node:stream/consumers';
import { fileURLToPath } from 'node:url';
import util from 'node:util';
import { type Options as ExecaOptions, execaCommand } from 'execa';
import extractZip from 'extract-zip';
import JSZip, { type JSZipObject } from 'jszip';
import { type DefaultRenderer, Listr, type ListrTaskWrapper, type SimpleRenderer } from 'listr2';
import { temporaryDirectoryTask } from 'tempy';

import { name, version } from '../package.json' with { type: 'json' };

const ROOT_PATH = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUTPUT_DIR = path.join(ROOT_PATH, '.output');
const EXT_ZIP_FILE_NAME = `coub-addons-${version}-firefox.zip`;

const BUILD_COMMAND = 'pnpm run release-build';

type Ctx = Record<never, never>;

const isStdoutTty = process.stdout.isTTY;

temporaryDirectoryTask(
	async dir => {
		console.log('Output dir:', OUTPUT_DIR);
		console.log('Temporary dir:', dir);
		console.log();

		const extZipPath = path.join(OUTPUT_DIR, EXT_ZIP_FILE_NAME),
			sourcesZipPath = path.join(OUTPUT_DIR, `coub-addons-${version}-sources.zip`);

		const exec = (
			task: ListrTaskWrapper<Ctx, typeof DefaultRenderer, typeof SimpleRenderer>,
			command: string,
			options?: Omit<ExecaOptions, 'stdio' | 'stdin' | 'stdout' | 'stderr'>,
		) => {
			const execute = execaCommand(command, options);

			execute.stdout.pipe(task.stdout());
			execute.stderr.pipe(task.stdout());

			return execute;
		};

		await new Listr<Ctx>([
			{
				title: 'Building reference package',
				task: (_, task) => exec(task, BUILD_COMMAND),
				rendererOptions: { outputBar: 10 },
			},
			{
				title: `Extracting ${inspect(relPath(extZipPath))} to ${inspect(dir)}`,
				task: () => extractZip(sourcesZipPath, { dir }),
			},
			{
				title: 'Installing dependencies',
				task: (_, task) => exec(task, 'pnpm i -P --frozen-lockfile', { cwd: dir }),
				rendererOptions: { outputBar: 10 },
			},
			{
				title: 'Clearing build artifacts',
				task: (_, task) => exec(task, 'pnpm su clean', { cwd: dir }),
			},
			{
				title: 'Building package from sources',
				task: (_, task) => exec(task, BUILD_COMMAND, { cwd: dir }),
				rendererOptions: { outputBar: 10 },
			},
			{
				title: "Comparing extension's files",
				task: async (_, task) => {
					const builtZipPath = path.join(dir, '.output', EXT_ZIP_FILE_NAME);

					task.output = `Reading zips ${inspect(relPath(extZipPath))} and ${inspect(builtZipPath)}`;

					const [refZip, builtZip] = await Promise.all([
						fsPromises.readFile(extZipPath).then(buf => JSZip.loadAsync(buf)),
						fsPromises.readFile(builtZipPath).then(buf => JSZip.loadAsync(buf)),
					]);

					const errors: string[] = [];

					for (const [path, refObj, builtObj] of iterZipFiles(refZip, builtZip)) {
						const coloredPath = inspect(path);

						task.output = `Checking ${coloredPath}`;

						if (!builtObj) {
							errors.push(`${coloredPath} exists in reference, but is missing in built`);
							continue;
						}

						if (!refObj) {
							errors.push(`${coloredPath} exists in built, but is missing in reference`);
							continue;
						}

						if (refObj.dir !== builtObj.dir) {
							errors.push(
								`${coloredPath} ref.dir = ${refObj.dir}, but built.dir = ${builtObj.dir}`,
							);
							continue;
						}

						if (refObj.dir) {
							continue;
						}

						const [refHash, builtHash] = await Promise.all([
							zipObjectHash(refObj),
							zipObjectHash(builtObj),
						]);

						if (refHash !== builtHash) {
							errors.push(
								`${coloredPath} hashes mismatch: ${refHash} (ref) != ${builtHash} (built)`,
							);
						}
					}

					if (errors.length) {
						throw new Error(errors.map(err => `\n- ${err}`).join(''));
					}
				},
			},
		]).run();
	},
	{ prefix: `${name}-${version}-build-repro-` },
);

function inspect(object: unknown) {
	return util.inspect(object, { colors: isStdoutTty });
}

function relPath(p: string) {
	return path.relative(ROOT_PATH, p);
}

function zipObjectHash(obj: JSZipObject) {
	return text(obj.nodeStream().pipe(crypto.createHash('sha256').setEncoding('hex'), { end: true }));
}

function* iterZipFiles(
	ref: JSZip,
	built: JSZip,
): Generator<
	| [path: string, ref: JSZipObject, built: JSZipObject]
	| [path: string, ref: null, built: JSZipObject]
	| [path: string, ref: JSZipObject, built: null],
	void,
	undefined
> {
	const refFiles = new Set(Object.keys(ref.files)),
		builtFiles = new Set(Object.keys(built.files)),
		allFiles = new Set([...refFiles, ...builtFiles]);

	for (const path of allFiles) {
		yield [path, ref.files[path], built.files[path]];
	}
}
