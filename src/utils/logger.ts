import { name } from '../../package.json';

interface LoggerOptions {
	devUniqueId?: string;
}

export class Logger {
	readonly #prefix: string;

	private constructor(prefix: string) {
		this.#prefix = prefix;
	}

	static create(prefix: string, options?: LoggerOptions) {
		let id = name;

		if (process.env.NODE_ENV === 'development' && options?.devUniqueId) {
			id = `${id} | ${options.devUniqueId}`;
		}

		return new Logger(`${id} | ${prefix}`);
	}

	get prefix(): string {
		return this.#prefix;
	}

	debug = (...args: unknown[]) => console.debug(...this.#withHeader(args));
	info = (...args: unknown[]) => console.info(...this.#withHeader(args));
	warn = (...args: unknown[]) => console.warn(...this.#withHeader(args));
	error = (...args: unknown[]) => console.error(...this.#withHeader(args));

	group = (...args: unknown[]) => console.group(...this.#withHeader(args));
	groupCollapsed = (...args: unknown[]) => console.groupCollapsed(...this.#withHeader(args));
	groupEnd = () => console.groupEnd();

	debugRaw = (...args: unknown[]) => console.debug(...args);
	tableRaw: Console['table'] = (...args) => console.table(...args);

	getChildLogger = (name: string) => new Logger(`${this.#prefix} | ${name}`);

	#withHeader(args: unknown[]) {
		return [`[${this.#prefix}]`, ...args] as const;
	}
}
