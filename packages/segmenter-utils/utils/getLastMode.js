// @ts-check

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import StreamSearch from 'streamsearch';

const devIfIncludes = Buffer.from('corrupt heap');
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const wasmJsPath = path.join(projectRoot, 'lib', 'segmenter_utils_rs.js');

/** @type {'debug' | 'release'} */
let mode = 'release';

const abortController = new AbortController();
/** @type {fs.ReadStream} */
let stream;

try {
	stream = fs.createReadStream(wasmJsPath, {
		encoding: 'utf8',
		signal: abortController.signal,
	});

	const ss = new StreamSearch(devIfIncludes, isMatch => {
		if (isMatch) {
			mode = 'debug';
			abortController.abort();
		}
	});

	for await (const chunk of stream) {
		ss.push(chunk);
	}
} catch (err) {
	if (
		!(err instanceof Error) ||
		!('code' in err) ||
		(err.code !== 'ENOENT' && err.code !== 'ABORT_ERR')
	) {
		throw err;
	}
}

process.stdout.write(mode);
