import { name } from '../../package.json';

interface LoggerOptions {
	devUniqueId?: string;
}

export class Logger {
	readonly #prefix: string;

	protected constructor(prefix: string) {
		this.#prefix = prefix;
	}

	static create(prefix: string, options?: LoggerOptions) {
		let id = name;

		if (import.meta.env.DEV && options?.devUniqueId) {
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

	groupAuto = (...args: unknown[]) =>
		(import.meta.env.DEV ? console.group : console.groupCollapsed)(...this.#withHeader(args));

	scopedGroupAuto = (...args: unknown[]) => (this.groupAuto(...args), this.#scoped());

	debugRaw = (...args: unknown[]) => console.debug(...args);
	tableRaw: Console['table'] = (...args) => console.table(...args);

	getChildLogger = (name: string) => new Logger(`${this.#prefix} | ${name}`);

	#withHeader(args: unknown[]) {
		return [`[${this.#prefix}]`, ...args] as const;
	}
	#scoped() {
		return new LoggerScopeGuard(this.#prefix);
	}
}

class LoggerScopeGuard extends Logger implements Disposable {
	[Symbol.dispose]() {
		console.groupEnd();
	}
}
