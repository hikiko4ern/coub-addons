import { Localized } from '@fluent/react';
import { Button } from '@nextui-org/button';
import cx from 'clsx';
import type { FunctionComponent } from 'preact';
import { useErrorBoundary } from 'preact/hooks';

import { ErrorCode } from '@/options/components/ErrorCode';
import { logger } from '@/options/constants';

import styles from './styles.module.scss';

export const ErrorBoundary: FunctionComponent = ({ children }) => {
	const [error, resetError] = useErrorBoundary((error, { componentStack }) =>
		logger.error(error, { componentStack }),
	);

	if (error) {
		return (
			<div className="flex w-full flex-1 flex-col items-center justify-center gap-y-4">
				<ErrorCode data={error} collapsible>
					<p>
						<Localized
							id="error-boundary-exception"
							elems={{
								recover: (
									<Button
										className={cx(
											'h-auto min-h-unit-8 whitespace-normal text-base',
											styles['error-boundary__recover'],
										)}
										color="success"
										size="sm"
										variant="light"
										onPress={resetError}
									/>
								),
							}}
						>
							<span />
						</Localized>
					</p>
				</ErrorCode>
			</div>
		);
	}

	return <>{children}</>;
};
