import { Localized } from '@fluent/react';
import { Button } from '@nextui-org/button';
import { useSignal } from '@preact/signals';
import cx from 'clsx';
import type { FunctionComponent } from 'preact';
import { useCallback, useEffect, useErrorBoundary } from 'preact/hooks';

import { ErrorCode } from '@/options/components/ErrorCode';
import { logger } from '@/options/constants';

import styles from './styles.module.scss';

export const ErrorBoundary: FunctionComponent = ({ children }) => {
	const [error, resetError] = useErrorBoundary((error, { componentStack }) =>
		logger.error(error, { componentStack }),
	);
	const attempt = useSignal(0);

	const tryToRecover = useCallback(() => {
		resetError();
		attempt.value += 1;
	}, [resetError]);

	const handleSuccessfulRender = useCallback(() => {
		attempt.value = 0;
	}, []);

	if (error) {
		return (
			<div className="flex flex-1 flex-col gap-y-4 items-center justify-center">
				<ErrorCode data={error} collapsible>
					<p>
						<Localized
							id="error-boundary-exception"
							vars={{ attempt: attempt.value }}
							elems={{
								recover: (
									<Button
										className={cx(
											'text-base',
											'h-auto',
											'min-h-unit-8',
											'whitespace-normal',
											styles['error-boundary__recover'],
										)}
										color="success"
										size="sm"
										variant="light"
										onPress={tryToRecover}
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

	return (
		<ErrorBoundaryContent onSuccessfulRender={handleSuccessfulRender}>
			{children}
		</ErrorBoundaryContent>
	);
};

interface ContentProps {
	onSuccessfulRender: () => void;
}

const ErrorBoundaryContent: FunctionComponent<ContentProps> = ({
	children,
	onSuccessfulRender,
}) => {
	useEffect(() => {
		onSuccessfulRender();
	}, []);

	return <>{children}</>;
};
