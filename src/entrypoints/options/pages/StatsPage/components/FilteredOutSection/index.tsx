import { Localized } from '@fluent/react';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@nextui-org/table';
import type { FunctionComponent, VNode } from 'preact';
import { useMemo } from 'preact/hooks';

import { CardSection } from '@/options/components/CardSection';
import { useLocalizationContext } from '@/options/hooks/useLocalizationContext';

import styles from './styles.module.scss';

interface Props {
	title: VNode;
	data: Record<string, number>;
	'aria-label': string;
}

export const FilteredOutSection: FunctionComponent<Props> = ({
	title,
	data,
	'aria-label': ariaLabel,
}) => {
	const { locale } = useLocalizationContext();
	const countFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);

	return (
		<CardSection title={title}>
			<Table
				classNames={{ table: styles['filtered-out-section'] }}
				removeWrapper
				aria-label={ariaLabel}
			>
				<TableHeader>
					<TableColumn>
						<Localized id="reason" />
					</TableColumn>

					<TableColumn className="text-right" align="end">
						<Localized id="count" />
					</TableColumn>
				</TableHeader>

				<TableBody>
					{Object.entries(data).map(([reason, count]) => (
						<TableRow key={reason}>
							<TableCell>
								<Localized id={reason} />
							</TableCell>
							<TableCell className="text-right">{countFormat.format(count)}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</CardSection>
	);
};
