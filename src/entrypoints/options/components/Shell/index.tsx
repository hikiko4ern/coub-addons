import { Localized } from '@fluent/react';
import { Link } from '@nextui-org/link';
import { Navbar, NavbarContent, NavbarItem } from '@nextui-org/navbar';
import type { FunctionComponent } from 'preact';
import { ToastContainer } from 'react-toastify';
import { Link as WLink, useLocation } from 'wouter-preact';

import { ErrorBoundary } from '@/options/components/ErrorBoundary';
import { useTabId } from '@/options/hooks/useTabId';
import { routes } from '@/options/routes';

export const Shell: FunctionComponent = ({ children }) => {
	const [location] = useLocation();
	const { isTabIdLoaded } = useTabId();

	return (
		<div className="flex min-h-screen w-full">
			<ToastContainer
				className="w-auto min-w-[var(--toastify-toast-width)] max-w-xl"
				position="top-center"
				theme="dark"
				newestOnTop
				closeOnClick
			/>

			<Navbar
				// TODO: switch to vertical layout on <sm
				className="w-auto shrink-0 grow flex-col justify-normal border-divider border-r p-4"
				classNames={{
					wrapper: 'w-auto h-auto flex-grow px-0 my-0 max-w-none',
				}}
				position="static"
			>
				<NavbarContent className="max-w-64 flex-col items-stretch" justify="start">
					{routes.map(({ path, title, icon: Icon }) => {
						const isActive = path === location;

						return (
							<NavbarItem key={path} className="whitespace-normal" isActive={isActive}>
								<WLink href={path} asChild>
									<Link
										className="w-full items-baseline font-medium"
										isBlock
										{...(isActive
											? {
													'aria-current': 'page',
												}
											: {
													color: 'foreground',
												})}
									>
										<Icon className="mr-2 shrink-0" height="1em" />
										<Localized id={title} />
									</Link>
								</WLink>
							</NavbarItem>
						);
					})}
				</NavbarContent>
			</Navbar>

			<div className="flex w-full flex-col items-start p-4">
				<ErrorBoundary>{isTabIdLoaded.value ? children : null}</ErrorBoundary>
			</div>
		</div>
	);
};
