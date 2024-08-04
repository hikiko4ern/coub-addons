import { SupportedLocale, submitFirefox } from '@coub-addons/publish-extension';

import { description, dryRun, releaseNotes } from '../upload/common';
import { jwtIssuer, jwtSecret, testExtensionId } from '../upload/init-firefox';
import { createTestZips } from './createTestZips';

if (!testExtensionId) {
	throw new Error('FIREFOX_TEST_EXTENSION_ID is not defined');
}

console.log('----------------------------\n');

const { firefoxExtPath, firefoxSourcesPath } = await createTestZips();

console.log(`
Test extension:
- ext: ${firefoxExtPath}
- sources: ${firefoxSourcesPath}
`);

await submitFirefox({
	dryRun,
	extensionId: testExtensionId,
	channel: 'unlisted',
	env: process.env.AMO_ORIGIN,
	extensionZipPath: firefoxExtPath,
	sourcesZipPath: firefoxSourcesPath,
	jwtIssuer,
	jwtSecret,
	description,
	releaseNotes: {
		[SupportedLocale.EN_US]: releaseNotes,
	},
});
