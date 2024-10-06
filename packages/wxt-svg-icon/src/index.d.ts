export interface SvgIconOptions {
	/**
	 * Enable auto-icons generation
	 * @default true
	 */
	enabled?: boolean;
	/**
	 * Path to the image to use.
	 *
	 * Path is relative to the project's src directory.
	 * @default "<srcDir>/assets/icon.svg"
	 */
	baseIconPath?: string;
}

declare module 'wxt' {
	interface InlineConfig {
		svgIcon?: SvgIconOptions;
	}
}
