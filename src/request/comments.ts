import type { KeysOfUnion } from 'type-fest';

import type { CommentsQuery, RepliesQuery } from '@/gql/comments/graphql';
import { isObject } from '@/helpers/isObject';
import type { BlockedChannelData } from '@/storage/blockedChannels';
import type { Context } from './ctx';
import { CommentExclusionReason } from './types/comment';

interface FilteredOutComment {
	reason: CommentExclusionReason;
	tReason: string;
	authorName: string | null | undefined;
	authorPermalink: string | null | undefined;
	message: string | null | undefined;
}

type Queries = CommentsQuery | RepliesQuery;
type QueriesFields = KeysOfUnion<Queries>;

type GetFromUnion<T, Key> = T extends unknown ? (Key extends keyof T ? T[Key] : never) : never;

const EXCLUSION_REASON_TEXT: Record<CommentExclusionReason, string> = {
	[CommentExclusionReason.CHANNEL_BLOCKED]: 'author is blocked manually',
};

const QUERY_FIELDS = ['entityComments', 'commentReplies'] satisfies QueriesFields[];

export const registerCommentsHandlers = (ctx: Context) => {
	ctx.webRequest.rewriteCompleteGraphql<Queries>({
		name: 'comments handler',
		filter: {
			urls: [`${ctx.commentsOrigin}/graphql`],
			types: ['xmlhttprequest'],
		},
		ifQueriesFields: QUERY_FIELDS,
		rewrite: async ({ ctx, logger, details, data }) => {
			let isModified = false;

			for (const field of QUERY_FIELDS) {
				const entity = data[field as never] as GetFromUnion<typeof data, typeof field> | undefined;

				if (
					!entity ||
					!isObject(entity) ||
					!Array.isArray(entity.comments) ||
					entity.comments.length < 1
				) {
					continue;
				}

				ctx.blockedChannels
					.actualizeChannelsData(iterAsBlockedChannels(entity.comments))
					.catch((err: unknown) => logger.error('failed to actualize blocked channels data', err));

				{
					const isHide = await ctx.blocklist.isHideCommentsFromBlockedChannels();

					if (!isHide) {
						logger.debug(
							'ignoring comments',
							field,
							'response due to isHideCommentsFromBlockedChannels =',
							isHide,
						);
						continue;
					}
				}

				const origAmount = entity.comments.length;

				const filteredComments: (typeof entity)['comments'] = [];
				const filteredOutComments: FilteredOutComment[] = [];

				const checker = await ctx.blocklistUtils.createChecker();

				for (const comment of entity.comments) {
					const [isExclude, reason] = checker.isExcludeComment(comment);

					if (isExclude) {
						filteredOutComments.push({
							reason,
							tReason: EXCLUSION_REASON_TEXT[reason],
							authorName: comment.author?.name,
							authorPermalink: comment.author?.permalink,
							message: comment.message,
						});
						continue;
					}

					filteredComments.push(comment);
				}

				entity.comments = filteredComments;
				isModified ||= filteredComments.length !== origAmount;

				if (filteredOutComments.length) {
					logger.groupCollapsed(
						'filtered out',
						filteredOutComments.length,
						filteredOutComments.length > 1 ? 'comments' : 'comment',
						'from',
						field,
					);
					logger.tableRaw(filteredOutComments, [
						'authorName',
						'tReason',
						'authorProfileUrl',
						'message',
					]);
					logger.groupEnd();

					ctx.stats.countFilteredOutComments(details.url, details.originUrl, filteredOutComments);
				}

				logger.debug(
					'processed',
					origAmount,
					origAmount > 1 ? 'comments,' : 'comment,',
					'returning',
					isModified ? filteredComments.length : 'all',
					'of them',
				);
			}

			if (isModified) {
				return data;
			}
		},
	});
};

function* iterAsBlockedChannels(
	comments: CommentsQuery['entityComments']['comments'],
): Generator<BlockedChannelData, void, never> {
	for (const comment of comments) {
		if (
			isObject(comment) &&
			isObject(comment.author) &&
			typeof comment.author.channelId === 'string' &&
			typeof comment.author.permalink === 'string' &&
			comment.author.permalink
		) {
			const id = Number.parseInt(comment.author.channelId, 10);

			if (!Number.isNaN(id)) {
				yield {
					id,
					title: (typeof comment.author.name === 'string' && comment.author.name) || '',
					permalink: comment.author.permalink,
				};
			}
		}
	}
}
