import type { KeysOfUnion } from 'type-fest';

import type { CommentsQuery, RepliesQuery } from '@/gql/comments/graphql';
import { isObject } from '@/helpers/isObject';
import type { BlockedChannelData } from '@/storage/blockedChannels';
import { CommentFromBlockedChannelAction } from '@/storage/blocklist';
import { t } from '@/translation/js';
import type { Context } from './ctx';
import { CommentHandlingReason } from './types/comment';

interface HandledComment {
	reason: CommentHandlingReason;
	tReason: string;
	authorName: string | null | undefined;
	authorPermalink: string | null | undefined;
	message: string | null | undefined;
}

type Queries = CommentsQuery | RepliesQuery;
type QueriesFields = KeysOfUnion<Queries>;

type GetFromUnion<T, Key> = T extends unknown ? (Key extends keyof T ? T[Key] : never) : never;

const HANDLING_REASON_TEXT: Record<CommentHandlingReason, string> = {
	[CommentHandlingReason.CHANNEL_BLOCKED]: 'author is blocked manually',
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

				const action = await ctx.blocklist.commentsFromBlockedChannelsAction();

				if (action === CommentFromBlockedChannelAction.Show) {
					logger.debug('ignoring comments', field, 'response due to action =', action);
					continue;
				}

				const origAmount = entity.comments.length;

				const filteredComments: (typeof entity)['comments'] = [];
				const handledComments: HandledComment[] = [];

				const checker = await ctx.blocklistUtils.createChecker();

				for (const comment of entity.comments) {
					const [isHandle, reason] = checker.isHandleComment(comment);

					if (isHandle) {
						handledComments.push({
							reason,
							tReason: HANDLING_REASON_TEXT[reason],
							authorName: comment.author?.name,
							authorPermalink: comment.author?.permalink,
							message: comment.message,
						});

						switch (action) {
							case CommentFromBlockedChannelAction.RemoveWithReplies:
								continue;

							case CommentFromBlockedChannelAction.HideMessage: {
								comment.message = t('hidden-comment-message');
								// TODO: add the feature to show hidden comment messages
								// (comment as UnknownRecord)[COMMENT_HIDDEN_KEY] = true;
								isModified = true;
								break;
							}
						}
					}

					filteredComments.push(comment);
				}

				entity.comments = filteredComments;
				isModified ||= filteredComments.length !== origAmount;

				if (handledComments.length) {
					logger.groupCollapsed(
						'handled',
						handledComments.length,
						handledComments.length > 1 ? 'comments' : 'comment',
						'from',
						field,
					);
					logger.tableRaw(handledComments, [
						'authorName',
						'tReason',
						'authorProfileUrl',
						'message',
					]);
					logger.groupEnd();

					ctx.stats.countHandledComments(details.url, details.originUrl, handledComments);
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
): Generator<BlockedChannelData, void, undefined> {
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
