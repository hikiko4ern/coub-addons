// @ts-expect-error - property is writable in runtimes without this well-known symbol
Symbol.dispose ??= Symbol.for('Symbol.dispose');
// @ts-expect-error - property is writable in runtimes without this well-known symbol
Symbol.asyncDispose ??= Symbol.for('Symbol.asyncDispose');

export type {};
