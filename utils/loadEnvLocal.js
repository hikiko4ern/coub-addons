import { loadEnvFile } from 'node:process';

loadEnvFileIfExists('.env.local');
loadEnvFile('.env');

/** @param {string} path */
function loadEnvFileIfExists(path) {
	try {
		loadEnvFile(path);
	} catch (err) {
		if (!(err instanceof Error) || !('code' in err) || err.code !== 'ENOENT') {
			throw err;
		}
	}
}
