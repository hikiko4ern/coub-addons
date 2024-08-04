import path from 'node:path';

import { ROOT_PATH } from '../_common.js';

export const OUTPUT_DIR = path.join(ROOT_PATH, '.output');
export const RELEASE_NOTES_DIR = path.join(ROOT_PATH, 'docs', 'release-notes');
