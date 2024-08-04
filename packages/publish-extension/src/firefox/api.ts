/// <reference types="../jsonwebtoken" />

import crypto from 'node:crypto';
import { openAsBlob } from 'node:fs';
import signJwt from 'jsonwebtoken/sign';

import path from 'node:path';
import type { SupportedLocale } from '../types';
import { type FirefoxAddonChannel, getAmoOrigin } from './options';
import type { AddonDetails, AddonVersion, UploadDetails } from './types';

export interface AmoApiOptions {
	env: string | undefined;
	channel: FirefoxAddonChannel;
	extensionId: string;
	jwtIssuer: string;
	jwtSecret: string;
}

export interface AmoCreateVersionOptions {
	uploadUuid: string;
	sourcesZipPath: string;
	description: Record<SupportedLocale, string>;
}

const API_ENDPOINT = '/api/v5';

export class AmoApi {
	#options: AmoApiOptions;
	amoOrigin: string | URL;

	constructor(options: AmoApiOptions) {
		this.#options = {
			...options,
			extensionId: normalizeExtensionId(options.extensionId),
		};
		this.amoOrigin = getAmoOrigin(this.#options.env);
	}

	// https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#detail
	getDetails(): Promise<AddonDetails> {
		return this.#req(this.#addonDetailEndpoint);
	}

	// https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#upload-create
	async createUpload(extensionZipPath: string, signal: AbortSignal): Promise<UploadDetails> {
		const form = new FormData();

		form.append('channel', this.#options.channel);
		form.append('upload', await openAsBlob(extensionZipPath), path.basename(extensionZipPath));

		return this.#req(this.#addonsUploadCreateEndpoint, { method: 'POST', body: form, signal });
	}

	// https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#upload-detail
	getUploadDetails(uploadUuid: string, signal: AbortSignal): Promise<UploadDetails> {
		return this.#req(this.#addonsUploadDetailsEndpoint(uploadUuid), { signal });
	}

	// https://mozilla.github.io/addons-server/topics/api/addons.html#version-sources
	// https://mozilla.github.io/addons-server/topics/api/addons.html#version-edit
	async createVersion(options: AmoCreateVersionOptions): Promise<AddonVersion> {
		const form = new FormData();

		form.append('upload', options.uploadUuid);
		form.append(
			'source',
			await openAsBlob(options.sourcesZipPath),
			path.basename(options.sourcesZipPath),
		);

		return this.#req<AddonVersion>(this.#addonVersionCreateEndpoint, {
			method: 'POST',
			body: form,
		});
	}

	patchVersion(versionId: number, releaseNotes: Record<string, string>) {
		return this.#req(this.#patchVersionEndpoint(versionId), {
			method: 'PATCH',
			body: JSON.stringify({
				release_notes: releaseNotes,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	patchAddon(description: Record<string, string>) {
		return this.#req(this.#patchAddonEndpoint, {
			method: 'PATCH',
			body: JSON.stringify({
				description,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	async #req<T>(input: string | URL | Request, init?: RequestInit): Promise<T> {
		const res = await fetch(input, {
			...init,
			headers: {
				...init?.headers,
				Authorization: `JWT ${this.#jwt}`,
			},
		});

		if (res.status > 299) {
			let text = '';

			try {
				text = await res.text();
			} catch {}

			throw new Error(`${res.statusText}: ${text}`);
		}

		return res.json();
	}

	/** @see https://addons-server.readthedocs.io/en/latest/topics/api/auth.html */
	get #jwt() {
		const issuedAt = Math.floor(Date.now() / 1000) - 5;

		return signJwt(
			{
				// spell-checker: ignore jti iat
				iss: this.#options.jwtIssuer,
				jti: crypto.randomUUID(),
				iat: issuedAt,
				exp: issuedAt + 35,
			},
			this.#options.jwtSecret,
			{ algorithm: 'HS256' },
		);
	}

	get #addonDetailEndpoint() {
		return new URL(`${API_ENDPOINT}/addons/addon/${this.#options.extensionId}`, this.amoOrigin);
	}

	get #addonsUploadCreateEndpoint() {
		return new URL(`${API_ENDPOINT}/addons/upload/`, this.amoOrigin);
	}

	#addonsUploadDetailsEndpoint(uploadUuid: string) {
		return new URL(`${API_ENDPOINT}/addons/upload/${uploadUuid}`, this.amoOrigin);
	}

	get #addonVersionCreateEndpoint() {
		return new URL(
			`${API_ENDPOINT}/addons/addon/${this.#options.extensionId}/versions/`,
			this.amoOrigin,
		);
	}

	get #patchAddonEndpoint() {
		return new URL(`${API_ENDPOINT}/addons/addon/${this.#options.extensionId}/`, this.amoOrigin);
	}

	#patchVersionEndpoint(id: number) {
		return new URL(
			`${API_ENDPOINT}/addons/addon/${this.#options.extensionId}/versions/${id}/`,
			this.amoOrigin,
		);
	}
}

/**
 * Ensure the extension id is wrapped in curly braces, that's what the addon store API is expecting
 * @example
 * "test" -> "{test}"
 */
function normalizeExtensionId(id: string): string {
	if (id.includes('@')) {
		return id;
	}

	if (!id.startsWith('{')) {
		// biome-ignore lint/style/useTemplate:
		id = '{' + id;
	}

	if (!id.endsWith('}')) {
		id += '}';
	}

	return id;
}
