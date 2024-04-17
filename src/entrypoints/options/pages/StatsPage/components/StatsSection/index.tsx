import { Card, CardBody, CardHeader } from '@nextui-org/card';
import type { ComponentChild, FunctionComponent } from 'preact';

interface Props {
	title: ComponentChild;
	children: ComponentChild;
}

export const StatsSection: FunctionComponent<Props> = ({ title, children }) => (
	<Card className="items-start" as="section" fullWidth={false}>
		<CardHeader>{title}</CardHeader>
		<CardBody className="w-auto">{children}</CardBody>
	</Card>
);
