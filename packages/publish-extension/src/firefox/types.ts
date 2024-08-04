import type { FirefoxAddonChannel } from './options';

export interface AddonDetails {
	id: string;
	description: Record<string, string> | null;
}

export interface AddonVersion {
	id: number;
	file: {
		id: number;
		url: string;
	};
}

export interface UploadDetails {
	uuid: string;
	channel: FirefoxAddonChannel;
	processed: boolean;
	submitted: boolean;
	url: string;
	valid: boolean;
	validation: {
		errors: number;
		warnings: number;
		notices: number;
	};
	version: string;
}
