import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import type { Manifest } from 'wxt/browser';

import { ROOT_PATH } from '../_common.js';

const TEST_EXT_DIR = path.join(ROOT_PATH, 'test-extension'),
	FIREFOX_EXT_PATH = path.join(TEST_EXT_DIR, 'firefox.zip'),
	FIREFOX_SOURCES_PATH = path.join(TEST_EXT_DIR, 'firefox-sources.zip');

const BG_SCRIPT_CONTENT = "console.log('background script started');\n";

export async function createTestZips() {
	const version = getUniqueVersion();

	await mkdir(TEST_EXT_DIR, { recursive: true });

	await createExtensionZip(FIREFOX_EXT_PATH, FIREFOX_SOURCES_PATH, {
		version,
		manifest_version: 2,
		background: {
			scripts: ['background.js'],
		},
	});

	return {
		firefoxExtPath: FIREFOX_EXT_PATH,
		firefoxSourcesPath: FIREFOX_SOURCES_PATH,
	};
}

function getUniqueVersion() {
	const time = String(Date.now());
	const major = Number(time.substring(0, 2));
	const minor = Number(time.substring(2, 5));
	const patch = Number(time.substring(5, 9));
	const number = Number(time.substring(9));
	const version = `${major}.${minor}.${patch}.${number}`;
	console.info('Using version:', version);
	return version;
}

function createExtensionZip(
	zipPath: string,
	sourcesZipPath: string | undefined,
	customManifest: Omit<Manifest.WebExtensionManifest, 'name'>,
) {
	const manifest: Manifest.WebExtensionManifest = {
		...customManifest,
		name: 'CI/CD Test',
	};

	const extZip = new JSZip();
	extZip.file('manifest.json', JSON.stringify(manifest));
	extZip.file('background.js', BG_SCRIPT_CONTENT);

	let sourcesZip: JSZip | undefined;

	if (sourcesZipPath) {
		sourcesZip = new JSZip();
		sourcesZip.file('manifest.json', JSON.stringify(manifest, null, 2));
		sourcesZip.file('background.js', BG_SCRIPT_CONTENT);
	}

	return Promise.all([
		archive(zipPath, extZip),
		sourcesZipPath && sourcesZip && archive(sourcesZipPath, sourcesZip),
	]);
}

function archive(path: string, zip: JSZip) {
	return new Promise<void>((resolve, reject) =>
		zip
			.generateNodeStream({
				// spell-checker: ignore nodebuffer
				type: 'nodebuffer',
				compression: 'DEFLATE',
				compressionOptions: { level: 9 },
			})
			.pipe(createWriteStream(path))
			.on('error', reject)
			.on('close', resolve),
	);
}
