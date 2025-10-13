import { stdout } from 'node:process';
import { codeToANSI } from '@shikijs/cli';

/**
 * @param {string} code
 * @param {import('shiki').BundledLanguage} lang
 */
export const printCode = async (code, lang) => {
	if (stdout.isTTY) {
		console.log((await codeToANSI(code, lang, 'ayu-dark')).trim());
	} else {
		stdout.write(code);
	}
};
