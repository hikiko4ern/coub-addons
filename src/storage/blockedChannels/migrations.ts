import type { DefineMigrations } from '../migrations';
import type { blockedChannelsVersion } from './index';
import type { RawBlockedChannels } from './types';

type Migrations = DefineMigrations<typeof blockedChannelsVersion, [RawBlockedChannels]>;

export const blockedChannelsMigrations: Migrations = {};
