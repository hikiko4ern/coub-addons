import QuestionMarkCircleIcon from '@heroicons/react/16/solid/QuestionMarkCircleIcon';
import { Tooltip, type TooltipPlacement } from '@nextui-org/tooltip';
import cx from 'clsx';
import type { FunctionComponent, VNode } from 'preact';

interface Props {
	className?: string;
	iconClassName?: string;
	/** @default 'right' */
	placement?: TooltipPlacement;
	children: VNode;
}

export const HintTooltip: FunctionComponent<Props> = ({
	className,
	iconClassName,
	placement = 'right',
	children,
}) => (
	<Tooltip className={cx('max-w-96', className)} content={children} placement={placement}>
		<QuestionMarkCircleIcon
			className={cx('inline-block h-4 w-4 cursor-help align-baseline', iconClassName)}
		/>
	</Tooltip>
);
