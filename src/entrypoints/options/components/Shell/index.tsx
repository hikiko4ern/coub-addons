import { Localized } from '@fluent/react';
import { Link } from '@nextui-org/link';
import { Navbar, NavbarContent, NavbarItem } from '@nextui-org/navbar';
import type { FunctionComponent } from 'preact';
import { Link as WLink, useLocation } from 'wouter-preact';

import { ErrorBoundary } from '@/options/components/ErrorBoundary';
import { useTabId } from '@/options/hooks/useTabId';
import { routes } from '@/options/routes';

export const Shell: FunctionComponent = ({ children }) => {
	const [location] = useLocation();
	const { isTabIdLoaded } = useTabId();

	return (
		<div className="w-full min-h-screen flex">
			<Navbar
				// TODO: switch to vertical layout on <sm
				className="w-auto flex-col justify-normal border-r border-divider p-4"
				classNames={{
					wrapper: 'w-auto h-auto flex-grow px-0 my-0 max-w-none',
				}}
				position="static"
			>
				<NavbarContent className="flex-col items-stretch" justify="start">
					{routes.map(({ path, title, icon: Icon }) => {
						const isActive = path === location;

						return (
							<NavbarItem key={path} isActive={isActive}>
								<WLink href={`#${path}`} asChild>
									<Link
										className="w-full font-medium"
										isBlock
										{...(isActive
											? {
													'aria-current': 'page',
											  }
											: {
													color: 'foreground',
											  })}
									>
										<Icon className="mr-2" height="1em" />
										<Localized id={title} />
									</Link>
								</WLink>
							</NavbarItem>
						);
					})}
				</NavbarContent>
			</Navbar>

			<div className="w-full p-4 flex flex-col">
				<ErrorBoundary>{isTabIdLoaded.value ? children : null}</ErrorBoundary>
			</div>
		</div>
	);
};
