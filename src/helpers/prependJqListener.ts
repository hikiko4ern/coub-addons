import type { Logger } from '@/utils/logger';

interface EventHandler {
	(eventObject: JQueryEventObject, ...args: unknown[]): unknown;
	wrappedJSObject?: Omit<EventHandler, 'wrappedJSObject'>;
}

interface JQueryEvent {
	handler: EventHandler;
}

export const prependJqListener = (
	logger: Logger,
	node: JQuery,
	event: string,
	eventKey: string,
	handler: EventHandler,
) => {
	node.on(event, handler);

	const newEvents = tryGetEventListeners(logger, node, eventKey);

	if (!newEvents) {
		return;
	}

	const addedEvents: JQueryEvent[] = [];
	const addedEventsIndexes: number[] = [];
	const waivedHandler = handler.wrappedJSObject || handler;

	for (const [i, e] of newEvents.entries()) {
		if (e.handler === waivedHandler) {
			addedEvents.push(e);
			addedEventsIndexes.push(i);
		}
	}

	if (!addedEvents.length || addedEvents.length === newEvents.length) {
		return;
	}

	{
		let i = addedEvents.length;
		while (i--) {
			newEvents.splice(addedEventsIndexes[i], 1);
		}
	}

	newEvents.unshift(...addedEvents);
};

const tryGetEventListeners = (
	logger: Logger,
	node: JQuery,
	eventKey: string,
): JQueryEvent[] | undefined => {
	try {
		const maybeEvents = node.data('events')?.[eventKey];
		return Array.isArray(maybeEvents) ? maybeEvents : undefined;
	} catch (err) {
		logger
			.getChildLogger('prependJqListener')
			.error('failed to get', eventKey, 'jQuery events:', err);
	}
};
