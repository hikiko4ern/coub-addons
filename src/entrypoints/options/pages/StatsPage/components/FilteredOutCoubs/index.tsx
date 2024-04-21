import { Localized, useLocalization } from '@fluent/react';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@nextui-org/table';
import type { FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';

import { CardSection } from '@/options/components/CardSection';
import { useLocalizationContext } from '@/options/hooks/useLocalizationContext';
import type { ReadonlyStats } from '@/storage/stats';

import styles from './styles.module.scss';

interface Props {
	data: ReadonlyStats['filtered'];
}

export const FilteredOutCoubs: FunctionComponent<Props> = ({ data }) => {
	const { l10n } = useLocalization();
	const { locale } = useLocalizationContext();
	const countFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);

	return (
		<CardSection title={<Localized id="filtered-out-coubs" />}>
			<Table
				classNames={{ table: styles['filtered-out-coubs'] }}
				removeWrapper
				aria-label={l10n.getString('statistics-of-filtered-out-coubs')}
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
