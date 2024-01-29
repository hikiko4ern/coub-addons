import { nextui } from '@nextui-org/theme';

/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/entrypoints/**/*.{html,tsx}',
		'./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		extend: {},
	},
	darkMode: 'class',
	plugins: [
		nextui({
			themes: {
				dark: {
					colors: {
						background: '#101010',
					},
				},
			},
		}),
	],
};
