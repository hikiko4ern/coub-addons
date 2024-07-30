import type jQuery from 'jquery';
import type { ConditionalKeys, OmitIndexSignature } from 'type-fest';

import type { Channel } from '@/api/types';
import type { TimelineResponseCoub } from '@/request/timeline';
import type { JstTemplateName } from './jst';

declare global {
	namespace coub {
		interface I18n {
			locale: string;
		}

		interface Gon {
			profile_channel?: ProfileChannel;
		}

		interface ProfileChannel {
			id: number;
			title: string;
			permalink: string;
		}

		interface AbsoluteDropdown {
			el: JQuery;
			content: JQuery;
		}

		interface CoubBlockClientside {
			el: Element;
			getViewerBlock(
				this: CoubBlockClientside & { wrappedJSObject?: CoubBlockClientside },
				...args: unknown[]
			): JQuery;

			prototype: {
				getViewerBlock: CoubBlockClientside['getViewerBlock'];
			} & CoubBlockClientsidePatches;
		}

		interface CoubBlockClientsidePatches {}

		interface Html5Player {
			data: TimelineResponseCoub;
			vb: JQuery;
			state?: string;
			preloadDefer?: Html5PlayerPreloadDefer;
			browserPaused?: boolean;
			/** returns `true` if the player and document are in focus */
			hasFocus(): boolean;
			/**
			 * preloads video and audio and starts (or resumes) playback
			 *
			 * @param force ignore user-paused playback?
			 */
			play(force?: boolean): void;
			/** starts (or resumes) playback */
			playLoop(): void;
			/** pauses playback */
			suspend(): void;
			/** pauses playback and shows suggestions above the video */
			pause(e?: Event): void;
			attachEvents(
				this: Html5Player & { wrappedJSObject?: Html5Player },
				...args: unknown[]
			): unknown;
			/**
			 * changes the player state
			 * @see Html5Player.prototype.STATE for a list of possible states
			 */
			changeState(
				this: Html5Player & { wrappedJSObject?: Html5Player },
				...args: unknown[]
			): unknown;
			toggleFullScreen(this: Html5Player): unknown;
			toggleFavourites(this: Html5Player): unknown;

			prototype: {
				attachEvents: Html5Player['attachEvents'];
				changeState: Html5Player['changeState'];
				toggleFullScreen: Html5Player['toggleFullScreen'];
				toggleFavourites: Html5Player['toggleFavourites'];
			} & Html5PlayerPatches;
		}

		interface Html5PlayerPreloadDefer {
			play: JQueryPromise<unknown>;
			load: JQueryPromise<unknown>;
		}

		interface Html5PlayerPatches {}

		namespace widgets {
			abstract class DislikeButton {
				static ACTIONS: {
					TOGGLE_DISLIKE: string;
				};
			}

			interface ChannelDropdown {
				data?: ChannelDropdownData;
				dropdown?: AbsoluteDropdown;
				setDropdownContent(
					this: ChannelDropdown & { wrappedJSObject?: ChannelDropdown },
					...args: unknown[]
				): JQuery;

				prototype: {
					setDropdownContent: ChannelDropdown['setDropdownContent'];
				} & ChannelDropdownPatches;
			}

			interface ChannelDropdownData {
				get(key: 'fullChannelData'): Channel | null;
				get(key: string): unknown;
			}

			const ChannelDropdown: ChannelDropdown;

			interface ChannelDropdownPatches {}
		}

		interface JST extends KnownJstTemplates, UnknownJstTemplates, JstPatches {}

		type KnownJstTemplates = Partial<Record<JstTemplateName, JstTemplate>>;

		type UnknownJstTemplates = Partial<Record<string, JstTemplate>>;

		interface JstPatches {}

		type JstTemplate = (this: Window['JST'], it: object, ...args: unknown[]) => string;
	}

	interface Window {
		$: typeof jQuery;
		gon: coub.Gon;
		I18n: coub.I18n;
		widgets: typeof coub.widgets;
		Html5Player: coub.Html5Player;
		CoubBlockClientside: coub.CoubBlockClientside;
		JST: coub.JST;

		// Gecko waived Xray
		// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
		// https://firefox-source-docs.mozilla.org/dom/scriptSecurity/xray_vision.html
		wrappedJSObject?: Omit<typeof window, 'wrappedJSObject'>;
		WeakMap: typeof WeakMap;
		WeakRef: typeof WeakRef;
		Reflect: typeof Reflect;
	}

	// Gecko's Xray-specific functions
	var cloneInto: <T>(value: T, ctx: unknown, options?: { cloneFunctions?: boolean }) => T;
	// biome-ignore lint/suspicious/noExplicitAny:
	var exportFunction: <T extends (...args: any[]) => any, Ctx>(
		fn: T,
		ctx: Ctx,
		options?: { defineAs: ConditionalKeys<Required<OmitIndexSignature<Ctx>>, T> },
	) => T;
}
