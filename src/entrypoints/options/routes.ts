import ChartBarIcon from '@heroicons/react/24/solid/ChartBarIcon';
import Cog6ToothIcon from '@heroicons/react/24/solid/Cog6ToothIcon';
import HashtagIcon from '@heroicons/react/24/solid/HashtagIcon';
import UsersIcon from '@heroicons/react/24/solid/UsersIcon';
import type { ComponentProps, ComponentType } from 'preact';
import type { RouteComponentProps } from 'wouter-preact';

import { BlockedChannels } from './components/BlockedChannels';
import { BlockedTags } from './components/BlockedTags';
import { Settings } from './components/Settings';
import { Stats } from './components/Stats';

interface Route {
	path: string;
	title: string;
	component: ComponentType<RouteComponentProps>;
	icon: ComponentType<ComponentProps<typeof ChartBarIcon>>;
}

export const routes: Route[] = [
	{
		path: '/',
		title: 'blocked-channels',
		component: BlockedChannels,
		icon: UsersIcon,
	},
	{
		path: '/blocked-tags',
		title: 'blocked-tags',
		component: BlockedTags,
		icon: HashtagIcon,
	},
	{
		path: '/stats',
		title: 'stats',
		component: Stats,
		icon: ChartBarIcon,
	},
	{
		path: '/settings',
		title: 'settings',
		component: Settings,
		icon: Cog6ToothIcon,
	},
];
