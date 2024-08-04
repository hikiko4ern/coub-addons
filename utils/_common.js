import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_PATH = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
