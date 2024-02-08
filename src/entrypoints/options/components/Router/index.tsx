import type { FunctionComponent } from 'preact';
import { Route, Switch } from 'wouter-preact';

import { routes } from '@/options/routes';

export const Router: FunctionComponent = () => (
	<Switch>
		{routes.map(({ path, component }) => (
			<Route key={path} path={path} component={component} />
		))}
	</Switch>
);
