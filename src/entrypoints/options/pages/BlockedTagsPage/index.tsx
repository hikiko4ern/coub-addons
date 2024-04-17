import type { FunctionComponent } from 'preact';

import { PhrasesBlocklist } from '@/options/components/PhrasesBlocklist';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';

export const BlockedTagsPage: FunctionComponent = () => {
	const { blockedTagsStorage } = useLazyStorages();

	return <PhrasesBlocklist storage={blockedTagsStorage} />;
};
