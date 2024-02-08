export const truthyFilter = <T>(value: T): value is Exclude<T, '' | 0 | false | null | undefined> =>
	Boolean(value);
