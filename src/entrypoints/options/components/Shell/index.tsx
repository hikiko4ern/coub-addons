import { Localized } from '@fluent/react';
import { Link } from '@nextui-org/link';
import { Navbar, NavbarContent, NavbarItem } from '@nextui-org/navbar';
import type { FunctionComponent } from 'preact';
import { useContext, useLayoutEffect } from 'preact/hooks';
import { ToastContainer } from 'react-toastify';
import { Link as WLink, useLocation } from 'wouter-preact';

import { ErrorBoundary } from '@/options/components/ErrorBoundary';
import { SettingsContext } from '@/options/components/SettingsProvider/context';
import { routes } from '@/options/routes';
import { Theme } from '@/storage/settings/types';

export const Shell: FunctionComponent = ({ children }) => {
	const [location] = useLocation();
	const { theme } = useContext(SettingsContext);

	useLayoutEffect(() => {
		const isDark = theme === Theme.DARK;
		document.documentElement.classList.toggle('dark', isDark);
		document.documentElement.classList.toggle('text-foreground', isDark);
	}, [theme]);

	return (
		<div className="flex min-h-screen w-full">
			<ToastContainer
				className="w-auto min-w-[var(--toastify-toast-width)] max-w-xl"
				position="top-center"
				theme={theme}
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
										<Icon className="relative top-[2px] mr-2 shrink-0" height="1em" />
										<Localized id={title} />
									</Link>
								</WLink>
							</NavbarItem>
						);
					})}
				</NavbarContent>
			</Navbar>

			<div className="flex w-full flex-col items-start p-4">
				<ErrorBoundary>{children}</ErrorBoundary>
			</div>
		</div>
	);
};
