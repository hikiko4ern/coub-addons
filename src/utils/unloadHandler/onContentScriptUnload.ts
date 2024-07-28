import { nanoid } from 'nanoid';
import serializeJavascript from 'serialize-javascript';

import { EventDispatcher } from '@/events';
import { Logger } from '@/utils/logger';

interface UnloadScript extends HTMLScriptElement {
	readonly dataset: { type: string; unloadClass: string };
	checkIfAlive: () => void;
}

const ID = nanoid();
const logger = Logger.create('onContentScriptUnload', { devUniqueId: ID });

// TODO: current implementation supports only Firefox
//
// in other browsers we should rely on `port.onDisconnect`
// (in Firefox it doesn't work because of https://bugzilla.mozilla.org/show_bug.cgi?id=1223425)
export const onContentScriptUnload = async <Args extends unknown[] = never[]>(
	type: string,
	handler: (...args: Args) => void,
	...args: Args
) => {
	const unloadStylesClass = await EventDispatcher.getUnloadStylesClass();

	if (!unloadStylesClass) {
		logger.error('failed to add content script unloading handler: got empty styles class');
		return;
	}

	const script = document.createElement('script') as UnloadScript;

	script.dataset.type = type;
	script.dataset.unloadClass = unloadStylesClass;
	script.textContent = stringifyFn(unloadScript).replace('__HANDLER__', stringifyFn(handler, args));

	exportFunction(() => {}, script, { defineAs: 'checkIfAlive' });

	(document.body || document.documentElement).appendChild(script);

	return () => {
		for (const span of document.querySelectorAll(`.${CSS.escape(unloadStylesClass)}`)) {
			span.remove();
		}
	};
};

declare const __HANDLER__: never;

function unloadScript() {
	const script = document.currentScript as UnloadScript | null;

	if (!script) {
		return;
	}

	script.remove();

	const checkIfAlive = script.checkIfAlive;
	const unloadClass = script.dataset.unloadClass;

	const span = document.createElement('span');

	span.className = unloadClass;
	span.dataset.type = script.dataset.type;
	span.style.opacity = '1';
	span.style.transitionProperty = 'opacity';
	span.style.transitionDelay = '100ms';
	span.style.transitionDuration = '1ms';

	// the time of triggering of this handler is undefined: it can be triggered either before the start
	// of execution of a new version of the content script or afterwards
	span.addEventListener('transitionstart', () => {
		try {
			return checkIfAlive();
		} catch (e) {}

		span.remove();
		__HANDLER__;
	});

	(document.body || document.documentElement).appendChild(span);
}

const stringifyFn = <Args extends unknown[]>(fn: (...args: Args) => unknown, args?: Args) => {
	const strArgs =
		Array.isArray(args) && args.length > 1 ? serializeJavascript(args).slice(1, -1) : '';

	return `(${fn})(${strArgs})`;
};
