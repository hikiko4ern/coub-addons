import type { DefineMigrations } from '../migrations';
import type { blockedTagsVersion } from './index';
import type { RawBlockedTags } from './types';

type Migrations = DefineMigrations<typeof blockedTagsVersion, [RawBlockedTags]>;

export const blockedTagsMigrations: Migrations = {};
