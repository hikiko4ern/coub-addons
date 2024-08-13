import { expect, test } from 'vitest';

import { serializeArg, serializeArgs } from '@/utils/unloadHandler/serializeArgs';

test('should serialize null', () => {
	expect(serializeArg(null)).toBe('null');
});

test('should serialize undefined', () => {
	expect(serializeArg(undefined)).toBe('undefined');
});

test('should serialize booleans', () => {
	expect(serializeArg(true)).toBe('true');
	expect(serializeArg(false)).toBe('false');
});

test('should serialize numbers', () => {
	expect(serializeArg(0)).toBe('0');
	expect(serializeArg(1)).toBe('1');
	expect(serializeArg(-1)).toBe('-1');
	expect(serializeArg(-404)).toBe('-404');
	expect(serializeArg(1_000_000)).toBe('1000000');
	expect(serializeArg(1e30)).toBe('1e+30');
	expect(serializeArg(-1e30)).toBe('-1e+30');
	expect(serializeArg(1e-30)).toBe('1e-30');
	expect(serializeArg(-1e-30)).toBe('-1e-30');
});

test('should serialize strings', () => {
	expect(serializeArg('')).toBe('""');
	expect(serializeArg('a')).toBe('"a"');
	expect(serializeArg('a'.repeat(1000))).toBe(`"${'a'.repeat(1000)}"`);
	expect(serializeArg('a\nb')).toBe('"a\\nb"');
	expect(serializeArg(`some ${'some'} text`)).toBe('"some some text"');
});

test('should serialize functions', () => {
	expect(serializeArg(a => a + 1)).toMatchInlineSnapshot(`"(a) => a + 1"`);
	expect(
		serializeArg(
			// biome-ignore format:
			// biome-ignore lint/complexity/useArrowFunction:
			function(a){a+1},
		),
	).toMatchInlineSnapshot(`
		"function(a) {
		        a + 1;
		      }"
	`);
	expect(
		serializeArg(
			// biome-ignore format:
			function fn(a){a+1},
		),
	).toMatchInlineSnapshot(`
		"function fn(a) {
		        a + 1;
		      }"
	`);
});

test('should serialize arrays', () => {
	const arr = [
		null,
		undefined,
		true,
		false,
		0,
		1,
		-1,
		-404,
		1_000_000,
		1e30,
		-1e30,
		1e-30,
		-1e-30,
		'',
		'a',
		'a\nb',
		`some ${'some'} text`,
		(a: number) => a + 1,
		// biome-ignore lint/complexity/useArrowFunction:
		function (a: number) {
			a + 1;
		},
		function fn(a: number) {
			a + 1;
		},
	];

	const serialized = serializeArgs(arr);

	expect(serialized).toMatchInlineSnapshot(`
		"null,undefined,true,false,0,1,-1,-404,1000000,1e+30,-1e+30,1e-30,-1e-30,"","a","a\\nb","some some text",(a) => a + 1,function(a) {
		      a + 1;
		    },function fn(a) {
		      a + 1;
		    }"
	`);

	expect(serializeArg(arr)).toBe(`[${serialized}]`);
});
