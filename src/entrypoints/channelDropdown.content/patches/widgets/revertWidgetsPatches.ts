import type { isObject as isObjectFn } from '@/helpers/isObject';
import type { CD_ADDED_NODES_KEY, CD_ADDED_NODES_SYM } from '../../constants';
import type {
	CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_KEY,
	CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_SYM,
} from './constants';

export function revertWidgetsPatches(
	isObject: typeof isObjectFn,
	addedNodesKey: typeof CD_ADDED_NODES_KEY,
	channelDropdownSetDropdownContentOrigKey: typeof CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_KEY,
	loggerPrefix = '',
	logger: Pick<Console, 'debug' | 'error'> = console,
	widgets?: typeof window.widgets,
) {
	const log = (method: keyof typeof logger, ...args: unknown[]) =>
		loggerPrefix ? logger[method](`[${loggerPrefix}]`, ...args) : logger[method](...args);

	try {
		const addedNodesSym: typeof CD_ADDED_NODES_SYM = Symbol.for(
			addedNodesKey,
		) as typeof CD_ADDED_NODES_SYM;

		const addedNodes = window[addedNodesSym];

		log('debug', 'removing added nodes', addedNodes);

		if (typeof addedNodes !== 'undefined') {
			for (const [i, entry] of addedNodes.entries()) {
				try {
					const unregister = entry[2]?.deref();
					unregister?.();
				} catch (err) {
					// it's ok... sometimes
					if (!(err instanceof Error) || !err.message.includes('dead object')) {
						log('error', i, 'failed to unregister', err);
					}
				} finally {
					entry[2] = undefined;
				}

				try {
					const node = entry[1]?.deref();
					node?.remove();
				} catch (err) {
					log('error', i, 'failed to remove node', err);
				} finally {
					entry[1] = undefined;
				}
			}
		}
	} catch (err) {
		log('error', 'failed to remove added nodes:', err);
	}

	try {
		if (!widgets) {
			if (!('widgets' in window) || Reflect.getOwnPropertyDescriptor(window, 'widgets')?.set) {
				log('debug', 'removing widgets `defineProperty` patch');

				return Reflect.defineProperty(window, 'widgets', {
					configurable: true,
					enumerable: true,
					writable: true,
					value: undefined,
				});
			}
		}

		widgets = window.widgets;

		if (isObject(widgets)) {
			if (
				!('ChannelDropdown' in widgets) ||
				Reflect.getOwnPropertyDescriptor(widgets, 'ChannelDropdown')?.set
			) {
				log('debug', 'removing ChannelDropdown `defineProperty` patch');

				return Reflect.defineProperty(widgets, 'ChannelDropdown', {
					configurable: true,
					enumerable: true,
					writable: true,
					value: undefined,
				});
			}

			const channelDropdownProto = widgets.ChannelDropdown.prototype;

			const channelDropdownSetDropdownContentOrigSym: typeof CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_SYM =
				Symbol.for(
					channelDropdownSetDropdownContentOrigKey,
				) as typeof CD_CHANNEL_DROPDOWN_SET_DROPDOWN_CONTENT_ORIG_SYM;

			const origSetDropdownContent = channelDropdownProto[channelDropdownSetDropdownContentOrigSym];

			if (origSetDropdownContent) {
				channelDropdownProto.setDropdownContent = origSetDropdownContent;
				delete channelDropdownProto[channelDropdownSetDropdownContentOrigSym];
			}
		}
	} catch (err) {
		log('error', 'failed to revert widgets patches:', err);
	}
}
