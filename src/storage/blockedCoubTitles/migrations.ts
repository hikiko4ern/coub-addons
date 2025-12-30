import type { DefineMigrations } from '../migrations';
import type { blockedCoubTitlesVersion } from './index';
import type { RawBlockedCoubTitles } from './types';

type Migrations = DefineMigrations<typeof blockedCoubTitlesVersion, [RawBlockedCoubTitles]>;

export const blockedCoubTitlesMigrations: Migrations = {};
