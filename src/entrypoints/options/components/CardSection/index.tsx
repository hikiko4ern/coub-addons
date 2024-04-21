import { Card, CardBody, CardHeader } from '@nextui-org/card';
import cx from 'clsx';
import type { ComponentChild, FunctionComponent } from 'preact';

interface Props {
	bodyClassName?: string;
	title: ComponentChild;
	children: ComponentChild;
}

export const CardSection: FunctionComponent<Props> = ({ bodyClassName, title, children }) => (
	<Card className="items-start" as="section" fullWidth={false}>
		<CardHeader>{title}</CardHeader>
		<CardBody className={cx('w-auto', bodyClassName)}>{children}</CardBody>
	</Card>
);
