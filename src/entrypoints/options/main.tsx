import { NextUIProvider } from '@nextui-org/system';
import { render } from 'preact';
import { HelmetProvider } from 'react-helmet-async';
import { Router as Wouter } from 'wouter-preact';
import { useHashLocation } from 'wouter-preact/use-hash-location';

import { LocalizationProvider } from './components/LocalizationProvider';
import { LocalizationContext } from './components/LocalizationProvider/context';
import { Router } from './components/Router';
import { SettingsProvider } from './components/SettingsProvider';
import { Shell } from './components/Shell';

import './style.scss';

render(
	<HelmetProvider>
		<Wouter hook={useHashLocation}>
			<SettingsProvider>
				<LocalizationProvider>
					<LocalizationContext.Consumer>
						{({ locale }) => (
							<NextUIProvider locale={locale}>
								<Shell>
									<Router />
								</Shell>
							</NextUIProvider>
						)}
					</LocalizationContext.Consumer>
				</LocalizationProvider>
			</SettingsProvider>
		</Wouter>
	</HelmetProvider>,
	// biome-ignore lint/style/noNonNullAssertion: `root` is always present, since it is rendered in the template
	document.getElementById('root')!,
);
