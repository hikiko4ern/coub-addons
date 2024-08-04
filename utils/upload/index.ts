import { SupportedLocale, submitFirefox } from '@coub-addons/publish-extension';

import { description, dryRun, releaseNotes } from './common';
import {
	channel,
	extZipPath,
	extensionId,
	jwtIssuer,
	jwtSecret,
	sourcesZipPath,
} from './init-firefox';

await submitFirefox({
	dryRun,
	extensionId,
	channel,
	env: process.env.AMO_ORIGIN,
	extensionZipPath: extZipPath,
	sourcesZipPath,
	jwtIssuer,
	jwtSecret,
	description,
	releaseNotes: {
		[SupportedLocale.EN_US]: releaseNotes,
	},
});
