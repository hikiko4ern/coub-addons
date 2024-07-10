import type jQuery from 'jquery';
import type { ConditionalKeys } from 'type-fest';

import type { TimelineResponseCoub } from '@/request/timeline';

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
			data: Pick<TimelineResponseCoub, 'permalink'>;
			vb: JQuery;
			attachEvents(
				this: Html5Player & { wrappedJSObject?: Html5Player },
				...args: unknown[]
			): unknown;
			toggleFullScreen(this: Html5Player): unknown;
			toggleFavourites(this: Html5Player): unknown;

			prototype: {
				attachEvents: Html5Player['attachEvents'];
				toggleFullScreen: Html5Player['toggleFullScreen'];
				toggleFavourites: Html5Player['toggleFavourites'];
			} & Html5PlayerPatches;
		}

		interface Html5PlayerPatches {}

		namespace widgets {
			abstract class DislikeButton {
				static ACTIONS: {
					TOGGLE_DISLIKE: string;
				};
			}
		}
	}

	interface Window {
		$: typeof jQuery;
		gon: coub.Gon;
		I18n: coub.I18n;
		widgets: typeof coub.widgets;
		Html5Player: coub.Html5Player;
		CoubBlockClientside: coub.CoubBlockClientside;

		// Gecko waived Xray
		// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
		// https://firefox-source-docs.mozilla.org/dom/scriptSecurity/xray_vision.html
		wrappedJSObject?: Window;
		WeakRef: typeof WeakRef;
	}

	// Gecko's Xray-specific functions
	var cloneInto: <T>(value: T, ctx: unknown) => T;
	// biome-ignore lint/suspicious/noExplicitAny:
	var exportFunction: <T extends (...args: any[]) => any, Ctx>(
		fn: T,
		ctx: Ctx,
		options?: { defineAs: ConditionalKeys<Ctx, T> },
	) => T;
}
