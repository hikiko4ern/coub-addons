import { is } from 'superstruct';

import { Channel } from '@/api/types';
import { getChannelPermalink } from '@/helpers/channel/getChannelPermalink';
import { type ChannelTitleData, getChannelTitleData } from '@/helpers/channel/getChannelTitleData';
import { isObject } from '@/helpers/isObject';
import type { BlockedChannelData } from '@/storage/blockedChannels';
import type { UnionToIntersection } from 'type-fest';
import type { Context } from './ctx';
import { ChannelExclusionReason, type FilteredOutChannelForStats } from './types/channel';

interface ChannelsResponse {
	page: number;
	per_page: number;
	total_pages: number;
	channels: Channel[];
}

interface FriendsResponse {
	friends: FriendsResponseFriend[];
}

interface FriendsResponseFriend extends Pick<Channel, 'title' | 'permalink'> {
	id: number;
	friend_id: number;
}

type ResponseChannel = Channel | FriendsResponseFriend;

interface FilteredOutChannel extends ChannelTitleData, FilteredOutChannelForStats {
	tReason: string;
	link: string;
}

const EXCLUSION_REASON_TEXT: Record<ChannelExclusionReason, string> = {
	[ChannelExclusionReason.BLOCKED]: 'blocked manually',
};

export const registerChannelsHandlers = (ctx: Context) => {
	ctx.webRequest.rewriteCompleteJsonResponse<ChannelsResponse | FriendsResponse>({
		name: 'channels handler',
		filter: {
			urls: [
				'/api/v2/channels/featured_channels',
				'/api/v2/channels/featured_channels?*',

				'/api/v2/channels/influencers_channels',
				'/api/v2/channels/influencers_channels?*',

				'/api/v2/channels/*/recommendations',
				'/api/v2/channels/*/recommendations?*',

				'/api/v2/friends/friends_to_follow',
				'/api/v2/friends/friends_to_follow?*',
			],
			types: ['xmlhttprequest'],
		},
		rewrite: async ({ ctx, logger, details, data }) => {
			if (!isObject(data)) {
				return;
			}

			const [key, channels] =
				'channels' in data
					? (['channels', data.channels] as const)
					: 'friends' in data
						? (['friends', data.friends] as const)
						: ([undefined, undefined] as const);

			if (!key || !Array.isArray(channels)) {
				return;
			}

			let isModified = false;

			ctx.blockedChannels
				.actualizeChannelsData(iterAsBlockedChannels(channels))
				.catch((err: unknown) => logger.error('failed to actualize blocked channels data', err));

			const origAmount = channels.length;

			const filteredChannels: ResponseChannel[] = [];
			const filteredOutChannels: FilteredOutChannel[] = [];

			const checker = await ctx.blocklistUtils.createChecker();

			for (const rawChannel of channels) {
				const channel = normalizeChannel(rawChannel);
				const [isExclude, reason] = checker.isExcludeChannel(channel);

				if (isExclude) {
					filteredOutChannels.push({
						...getChannelTitleData(channel),
						permalink: channel.permalink,
						reason,
						tReason: EXCLUSION_REASON_TEXT[reason],
						link: getChannelPermalink(channel.permalink).toString(),
					});
					continue;
				}

				filteredChannels.push(rawChannel as ResponseChannel);
			}

			// biome-ignore lint/suspicious/noExplicitAny: TS specifics
			(data as UnionToIntersection<typeof data>)[key] = filteredChannels as any;
			isModified = filteredChannels.length !== origAmount;

			if (filteredOutChannels.length) {
				logger.groupCollapsed(
					'filtered out',
					filteredOutChannels.length,
					filteredOutChannels.length > 1 ? 'channels' : 'channel',
				);
				logger.tableRaw(filteredOutChannels, ['title', 'tReason', 'link']);
				logger.groupEnd();

				ctx.stats.countFilteredOutChannels(details.url, details.originUrl, filteredOutChannels);
			}

			logger.debug(
				'processed',
				origAmount,
				origAmount > 1 ? 'channels,' : 'channel,',
				'returning',
				isModified ? filteredChannels.length : 'all',
				'of them',
			);

			if (isModified) {
				return data;
			}
		},
	});
};

const normalizeChannel = (channel: ResponseChannel): Channel => {
	if ('friend_id' in channel) {
		const { id: _, friend_id, ...rest } = channel;

		return {
			id: friend_id,
			...rest,
		};
	}

	return channel;
};

function* normalizeChannels(
	channels: Iterable<ResponseChannel>,
): Generator<Channel, void, undefined> {
	for (const channel of channels) {
		yield normalizeChannel(channel);
	}
}

function* iterAsBlockedChannels(
	channels: Iterable<Channel>,
): Generator<BlockedChannelData, void, undefined> {
	for (const channel of normalizeChannels(channels)) {
		if (is(channel, Channel)) {
			yield {
				id: channel.id,
				title: channel.title,
				permalink: channel.permalink,
			};
		}
	}
}
