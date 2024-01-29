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
	}

	interface Window {
		gon: coub.Gon;
		I18n: coub.I18n;
		// Gecko waived Xray
		// https://firefox-source-docs.mozilla.org/dom/scriptSecurity/xray_vision.html
		wrappedJSObject?: Window;
	}
}

export type {};
