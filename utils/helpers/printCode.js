import { codeToANSI } from '@shikijs/cli';

/**
 * @param {import('node:net').Socket | import('node:tty').WriteStream} stream
 * @param {string} code
 * @param {import('shiki').BundledLanguage} lang
 */
export const printCode = async (stream, code, lang) => {
	if ('isTTY' in stream && stream.isTTY && stream.hasColors()) {
		stream.write(await codeToANSI(code, lang, 'dracula-soft'));
	} else {
		stream.write(code + '\n');
	}
};
