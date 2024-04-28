import { FluentType, type Scope } from '@fluent/bundle';

declare module '@fluent/bundle/esm/scope' {
	export interface Scope {
		memoizeIntlObject(ctor: typeof Intl.ListFormat, opts: Intl.ListFormatOptions): Intl.ListFormat;
	}
}

export class FluentList extends FluentType<Iterable<string>> {
	private opts: Intl.ListFormatOptions;

	constructor(value: Iterable<string>, opts: Intl.ListFormatOptions) {
		super(value);
		this.opts = opts;
	}

	toString(scope: Scope): string {
		try {
			const lf = scope.memoizeIntlObject(Intl.ListFormat, this.opts);
			return lf.format(this.value);
		} catch (err) {
			scope.reportError(err);
			return Array.isArray(this.value) ? this.value.join(', ') : Array.from(this.value).join(', ');
		}
	}
}
