import { NextUIProvider } from '@nextui-org/system';
import { render } from 'preact';
import { HelmetProvider } from 'react-helmet-async';
import { Router as Wouter } from 'wouter-preact';
import { useHashLocation } from 'wouter-preact/use-hash-location';

import { LocalizationProvider } from './components/LocalizationProvider';
import { Router } from './components/Router';
import { Shell } from './components/Shell';
import './style.scss';

render(
	<HelmetProvider>
		<Wouter hook={useHashLocation}>
			<NextUIProvider>
				<LocalizationProvider>
					<Shell>
						<Router />
					</Shell>
				</LocalizationProvider>
			</NextUIProvider>
		</Wouter>
	</HelmetProvider>,
	// biome-ignore lint/style/noNonNullAssertion: `root` is always present, since it is rendered in the template
	document.getElementById('root')!,
);
