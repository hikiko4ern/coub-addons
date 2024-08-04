import { isDeepStrictEqual } from 'node:util';
import { Listr } from 'listr2';
import pc from 'picocolors';
import type { SetOptional } from 'type-fest';

import type { SupportedLocale } from '../types';
import { pluralize, sleep, withTimeout } from '../utils';
import { AmoApi, type AmoApiOptions, type AmoCreateVersionOptions } from './api';
import type { AddonDetails, AddonVersion, UploadDetails } from './types';

// Firefox recommends 5-10s polling and a 10 minute timeout
const POLL_INTERVAL = 5e3; // 5 seconds
const TIMEOUT = 10 * 60e3; // 10 minutes
const SLEEP_BETWEEN_REQUESTS = 3e3; // 3 seconds

interface Options extends AmoApiOptions, Omit<AmoCreateVersionOptions, 'uploadUuid'> {
	dryRun: boolean;
	extensionZipPath: string;
	releaseNotes: SetOptional<
		Record<SupportedLocale, string>,
		Exclude<SupportedLocale, SupportedLocale.EN_US>
	>;
}

interface Ctx {
	addon: AddonDetails;
	upload: UploadDetails;
	version: AddonVersion;
}

export const submitFirefox = (options: Options) => {
	const api = new AmoApi(options);

	console.log(`\
----------------------------

${options.dryRun ? `    ${pc.bgYellow(pc.black('[DRY RUN]'))}\n\n` : ''}\
      ${pc.bold('[AMO]')}
     env: ${options.env}
  origin: ${api.amoOrigin}

      ${pc.bold('[ext]')}
      id: ${options.extensionId}
 channel: ${options.channel}

      ${pc.bold('[zips]')}
     ext: ${options.extensionZipPath}
 sources: ${options.sourcesZipPath}

----------------------------
 `);

	return new Listr<Ctx>([
		{
			title: 'Getting addon details',
			task: async ctx => {
				ctx.addon = await api.getDetails();
			},
		},
		{
			title: 'Uploading new ZIP file',
			task: async (ctx, task) => {
				ctx.upload = await withTimeout(async function uploadAndPollValidation(signal: AbortSignal) {
					let details = await api.createUpload(options.extensionZipPath, signal);

					task.title = 'Waiting for validation results';

					while (!details.processed) {
						await sleep(POLL_INTERVAL, signal);
						details = await api.getUploadDetails(details.uuid, signal);
					}

					return details;
				}, TIMEOUT);
			},
			skip: options.dryRun,
		},
		{
			title: 'Creating version',
			task: async (ctx, task) => {
				const { errors, notices, warnings } = ctx.upload.validation;

				task.output = `Validation results: ${pluralize(errors, 'error')}, ${pluralize(
					warnings,
					'warning',
				)}, ${pluralize(notices, 'notice')}`;

				ctx.version = await api.createVersion({
					...options,
					uploadUuid: ctx.upload.uuid,
				});

				const validationUrl = new URL(
					`/en-US/developers/addon/${ctx.addon.id}/file/${ctx.version.file.id}/validation`,
					api.amoOrigin,
				);

				if (ctx.upload.valid) {
					task.output = `Firefox validation results: ${validationUrl}`;
					task.output = `Firefox file URL: ${ctx.version.file.url}`;
				} else {
					throw new Error(`Extension is invalid: ${validationUrl}`);
				}
			},
			skip: options.dryRun,
			rendererOptions: { persistentOutput: true, outputBar: Number.POSITIVE_INFINITY },
		},
		{
			title: 'Adding release notes',
			task: async ({ version }, task) => {
				task.title = `Sleeping ${SLEEP_BETWEEN_REQUESTS}ms before adding release notes`;
				await sleep(SLEEP_BETWEEN_REQUESTS);

				task.title = 'Adding release notes';
				await api.patchVersion(version.id, options.releaseNotes);
			},
			skip: options.dryRun,
			exitOnError: false,
		},
		{
			title: 'Updating description',
			task: async (_, task) => {
				task.title = `Sleeping ${SLEEP_BETWEEN_REQUESTS}ms before updating description`;
				await sleep(SLEEP_BETWEEN_REQUESTS);

				task.title = 'Updating description';
				await api.patchAddon(options.description);
			},
			skip: ({ addon }) =>
				options.dryRun ||
				(isDeepStrictEqual(addon.description, options.description) &&
					'Not updating descriptions: they are equal'),
			exitOnError: false,
		},
	]).run({} as Ctx);
};
