import { type Infer, create, defaulted, define, enums, union } from 'superstruct';

const AmoEnv = defaulted(enums(['prod', 'stage', 'dev']), 'prod');

const AmoOrigin = define<string>('AMO origin', value => {
	if (typeof value !== 'string' || !value) {
		return 'expected non-empty string';
	}

	try {
		const url = new URL(value);

		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return 'protocol must be http/https';
		}

		if (url.pathname !== '/') {
			return 'pathname must be empty';
		}

		return true;
	} catch (err) {
		return `invalid URL: ${err}`;
	}
});

const AmoEnvOrOrigin = union([AmoOrigin, AmoEnv]);

export const FirefoxAddonChannel = enums(['listed', 'unlisted']);
export type FirefoxAddonChannel = Infer<typeof FirefoxAddonChannel>;

const ORIGINS: Record<Infer<typeof AmoEnv>, URL> = {
	prod: new URL('https://addons.mozilla.org'),
	stage: new URL('https://addons.allizom.org'),
	dev: new URL('https://addons-dev.allizom.org'),
};

export const getAmoOrigin = (origin: unknown) => {
	const target = create(origin, AmoEnvOrOrigin);
	return target in ORIGINS ? ORIGINS[target as keyof typeof ORIGINS] : target;
};
