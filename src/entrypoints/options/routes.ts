import ChartPieIcon from '@heroicons/react/24/solid/ChartPieIcon';
import UsersIcon from '@heroicons/react/24/solid/UsersIcon';
import type { ComponentProps, ComponentType } from 'preact';
import type { RouteComponentProps } from 'wouter-preact';

import { BlockedChannels } from './components/BlockedChannels';
import { Stats } from './components/Stats';

interface Route {
	path: string;
	title: string;
	component: ComponentType<RouteComponentProps>;
	icon: ComponentType<ComponentProps<typeof ChartPieIcon | typeof UsersIcon>>;
}

export const routes: Route[] = [
	{
		path: '/',
		title: 'blocked-channels',
		component: BlockedChannels,
		icon: UsersIcon,
	},
	{
		path: '/stats',
		title: 'stats',
		component: Stats,
		icon: ChartPieIcon,
	},
];
