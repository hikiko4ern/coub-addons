import type { Channel } from '@/api/types';

export const getChannelTitle = (channel: Channel) => channel?.title || channel?.id;
