import { Localized } from '@fluent/react';
import { Button } from '@nextui-org/button';
import { type Signal, useSignal } from '@preact/signals';
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

	if (error) {
		return (
			<div className="w-full flex flex-1 flex-col gap-y-4 items-center justify-center">
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

	return <ErrorBoundaryContent attempt={attempt}>{children}</ErrorBoundaryContent>;
};

interface ContentProps {
	attempt: Signal<number>;
}

const ErrorBoundaryContent: FunctionComponent<ContentProps> = ({ attempt, children }) => {
	useEffect(() => {
		attempt.value = 0;
	}, []);

	return <>{children}</>;
};
