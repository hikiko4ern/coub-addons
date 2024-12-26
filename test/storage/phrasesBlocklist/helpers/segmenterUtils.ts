import { segmentWords } from '@coub-addons/segmenter-utils/sync';

import type { SegmenterUtils } from '@/storage/phrasesBlocklist/helpers/segmenterUtils';

export const segmenterUtils: SegmenterUtils = {
	segmentWords,
};
