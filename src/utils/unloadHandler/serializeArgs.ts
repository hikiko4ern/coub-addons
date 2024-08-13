export type SerializableArg =
	| null
	| undefined
	| boolean
	| number
	| string
	// biome-ignore lint/suspicious/noExplicitAny: required for correct types inference
	| ((...args: any[]) => any)
	| SerializableArg[];

const NATIVE_CODE_RE = /\{\s*\[native code\]\s*\}/g;

export const serializeArgs = (args: SerializableArg[]): string => args.map(serializeArg).join(',');

export const serializeArg = (arg: SerializableArg): string => {
	switch (typeof arg) {
		case 'undefined':
			return String(arg);

		case 'boolean':
		case 'number':
		case 'string':
			return JSON.stringify(arg);

		case 'object': {
			if (arg === null) {
				return String(arg);
			}

			if (Array.isArray(arg)) {
				return `[${serializeArgs(arg)}]`;
			}

			throw new TypeError(`Unsupported value of type ${typeof arg}: ${arg}`);
		}

		case 'function': {
			const code = arg.toString();

			if (NATIVE_CODE_RE.test(code)) {
				throw new TypeError(`Function contains native code: ${arg}`);
			}

			return code;
		}

		default:
			throw new TypeError(`Unsupported value of type ${typeof arg}: ${arg}`);
	}
};
