import type { FunctionComponent } from 'preact';

import { PhrasesBlocklist } from '@/options/components/PhrasesBlocklist';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';

export const BlockedCoubTitlesPage: FunctionComponent = () => {
	const { blockedCoubTitlesStorage } = useLazyStorages();

	return <PhrasesBlocklist storage={blockedCoubTitlesStorage} />;
};
