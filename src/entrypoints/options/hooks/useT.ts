import { createTranslator } from '@/translation/helpers/createTranslator';
import { useLocalization } from '@fluent/react';
import { useMemo } from 'preact/hooks';

export const useT = () => {
	const { l10n } = useLocalization();

	return useMemo(() => createTranslator(id => l10n.getBundle(id)), [l10n]);
};
