import type { Browser, Events } from 'webextension-polyfill';

import { Logger } from '@/utils/logger';
import type { StorageEvent } from './storage/types';

interface I18nLocaleEvent {
	type: 'I18nLocaleEvent';
	locale: string;
}

interface StorageUpdatedEvent {
	type: 'StorageUpdatedEvent';
	data: StorageEvent;
}

interface GetTabIdEvent {
	type: 'GetTabId';
}

type Event = I18nLocaleEvent | StorageUpdatedEvent | GetTabIdEvent;

type EventHandler = OnMessageHandlerWithMessageType<Event>;

const EVENT_IDS: ReadonlySet<Event['type']> = new Set([
	'I18nLocaleEvent',
	'StorageUpdatedEvent',
	'GetTabId',
]);
const logger = Logger.create('events');

export class EventDispatcher {
	private static async dispatchEvent<Response = void>(event: Event) {
		return EventDispatcher.dispatch<Response>('runtime', event, event =>
			browser.runtime.sendMessage(event),
		);
	}

	static async dispatch<Response>(
		target: string,
		event: Event,
		sendMessage: (event: Event) => Promise<Response>,
	) {
		try {
			logger.debug('dispatching event', event, 'to', target);
			return await sendMessage(event);
		} catch (err) {
			logger.error('dispatching error:', err);
		}
	}

	static dispatchI18nLocale = (locale: I18nLocaleEvent['locale']) =>
		EventDispatcher.dispatchEvent({ type: 'I18nLocaleEvent', locale });

	static dispatchStorageUpdate = (data: StorageUpdatedEvent['data']) =>
		EventDispatcher.dispatchEvent({ type: 'StorageUpdatedEvent', data });

	static getTabId = () => EventDispatcher.dispatchEvent<number>({ type: 'GetTabId' });
}

export class EventListener implements Disposable {
	readonly #logger: Logger;
	readonly #unsubscribe: () => void;

	constructor(logger: Logger, handler: EventHandler) {
		this.#logger = logger.getChildLogger('EventListener');

		this.#logger.debug('setting up handlers');

		const handleEvent: OnMessageHandler = (e: unknown, ...args) => {
			try {
				if (isEvent(e)) {
					this.#logger.debug('received event', e);
					return handler(e as Event, ...args);
				}
			} catch (err) {
				this.#logger.error('failed to handle event', e, err);
			}
		};

		browser.runtime.onMessage.addListener(handleEvent);

		this.#unsubscribe = () => {
			browser.runtime.onMessage.removeListener(handleEvent);
		};
	}

	[Symbol.dispose]() {
		this.#unsubscribe();
	}
}

const isEvent = (value: unknown): value is Event =>
	typeof value === 'object' &&
	value !== null &&
	'type' in value &&
	EVENT_IDS.has(value.type as never);

type OnMessageHandler = Browser['runtime']['onMessage'] extends Events.Event<infer Handler>
	? Handler
	: never;

type OnMessageHandlerWithMessageType<Message> = OnMessageHandler extends (
	message: unknown,
	...args: infer Rest
) => infer Res
	? (message: Message, ...args: Rest) => Res
	: never;
