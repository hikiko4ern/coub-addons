import ChartBarIcon from '@heroicons/react/24/solid/ChartBarIcon';
import Cog6ToothIcon from '@heroicons/react/24/solid/Cog6ToothIcon';
import DocumentTextIcon from '@heroicons/react/24/solid/DocumentTextIcon';
import HashtagIcon from '@heroicons/react/24/solid/HashtagIcon';
import NoSymbolIcon from '@heroicons/react/24/solid/NoSymbolIcon';
import PlayCircleIcon from '@heroicons/react/24/solid/PlayCircleIcon';
import UsersIcon from '@heroicons/react/24/solid/UsersIcon';
import type { ComponentProps, ComponentType } from 'preact';
import type { RouteComponentProps } from 'wouter-preact';

import { BlockedChannelsPage } from './pages/BlockedChannelsPage';
import { BlockedCoubTitlesPage } from './pages/BlockedCoubTitlesPage';
import { BlockedTagsPage } from './pages/BlockedTagsPage';
import { BlocklistPage } from './pages/BlocklistPage';
import { PlayerSettingsPage } from './pages/PlayerSettingsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';

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
		component: BlockedChannelsPage,
		icon: UsersIcon,
	},
	{
		path: '/blocked-tags',
		title: 'blocked-tags',
		component: BlockedTagsPage,
		icon: HashtagIcon,
	},
	{
		path: '/blocked-coub-titles',
		title: 'blocked-coub-titles',
		component: BlockedCoubTitlesPage,
		icon: DocumentTextIcon,
	},
	{
		path: '/blocklist',
		title: 'blocklist',
		component: BlocklistPage,
		icon: NoSymbolIcon,
	},
	{
		path: '/player',
		title: 'player',
		component: PlayerSettingsPage,
		icon: PlayCircleIcon,
	},
	{
		path: '/stats',
		title: 'stats',
		component: StatsPage,
		icon: ChartBarIcon,
	},
	{
		path: '/settings',
		title: 'settings',
		component: SettingsPage,
		icon: Cog6ToothIcon,
	},
];
