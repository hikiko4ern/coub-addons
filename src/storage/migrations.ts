import type { FixedLengthArray } from 'type-fest';

type DigitsArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
type Digit = DigitsArr[number];

type _Increment<T extends string> = T extends `${infer F}${Digit}`
	? T extends `${F}${infer L extends Digit}`
		? `${L extends 9 ? _Increment<F> : F}${DigitsArr[L]}`
		: never
	: 1;

type Increment<T extends number> = number extends T
	? number
	: _Increment<`${T}`> extends `${infer N extends number}`
		? N
		: never;

export type DefineMigrations<
	CurrentVersion extends number,
	Versions extends FixedLengthArray<any, NoInfer<CurrentVersion>>,
> = {
	[index in keyof Versions as index extends `${infer index extends number}`
		? Increment<index> extends infer nextIndex extends number
			? `${nextIndex}` extends keyof Versions
				? Increment<nextIndex>
				: never
			: never
		: never]: (
		prev: Versions[index],
	) => index extends `${infer index extends number}` ? Versions[Increment<index>] : never;
};
