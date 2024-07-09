import type { EntityCommentsQuery } from '@/gql/comments/graphql';
import { isObject } from '@/helpers/isObject';
import { isPromise } from '@/helpers/isPromise';
import { CommentExclusionReason } from './coub';
import type { Context } from './ctx';

interface FilteredOutComment {
	reason: CommentExclusionReason;
	tReason: string;
	authorName: string | null | undefined;
	authorProfileUrl: string | null | undefined;
	message: string | undefined;
}

const EXCLUSION_REASON_TEXT: Record<CommentExclusionReason, string> = {
	[CommentExclusionReason.CHANNEL_BLOCKED]: 'author is blocked manually',
};

export const registerCommentsHandlers = (ctx: Context) => {
	ctx.webRequest.rewriteCompleteGraphql<EntityCommentsQuery, { isCheckSetting?: true }>({
		filter: {
			urls: [`${ctx.commentsOrigin}/graphql`],
			types: ['xmlhttprequest'],
		},
		// NOTE: as of July 10, 2024, the `threadComments` request is not present in `disqus-3d9410fccc8802be8a3b.js`
		// fyi: Coub uses Apollo Client (v3.7.10 at the time of writing; https://www.apollographql.com/docs/react)
		ifQueriesFields: ['entityComments'],
		isHandleRequest: ctx => {
			const isHide = ctx.ctx.blocklist.isHideCommentsFromBlockedChannels();

			return isPromise(isHide)
				? (ctx.logger.debug('deferring `blocklist.isHideCommentsFromBlockedChannels`', isHide),
					(ctx.isCheckSetting = true),
					[true])
				: isHide
					? [true]
					: [false, 'isHideCommentsFromBlockedChannels =', isHide];
		},
		rewrite: async ({ ctx, data, logger, isCheckSetting }) => {
			if (isCheckSetting && !(await ctx.blocklist.isHideCommentsFromBlockedChannels())) {
				return;
			}

			let isModified = false;
			const { entityComments } = data;

			const filteredComments: (typeof entityComments)['comments'] = [];
			const filteredOutComments: FilteredOutComment[] = [];

			if (
				isObject(entityComments) &&
				Array.isArray(entityComments.comments) &&
				entityComments.comments.length > 0
			) {
				const origAmount = entityComments.comments.length;

				const checker = await ctx.coubHelpers.createChecker();

				for (const comment of entityComments.comments) {
					const [isExclude, reason] = checker.isExcludeComment(comment);

					if (isExclude) {
						filteredOutComments.push({
							reason,
							tReason: EXCLUSION_REASON_TEXT[reason],
							authorName: comment.author?.name,
							authorProfileUrl: comment.author?.profileUrl,
							message: comment.message,
						});
						continue;
					}

					filteredComments.push(comment);
				}

				data.entityComments.comments = filteredComments;
				isModified = filteredComments.length !== origAmount;

				if (filteredOutComments.length) {
					logger.groupCollapsed(
						'filtered out',
						filteredOutComments.length,
						filteredOutComments.length > 1 ? 'comments' : 'comment',
					);
					logger.tableRaw(filteredOutComments, [
						'authorName',
						'tReason',
						'authorProfileUrl',
						'message',
					]);
					logger.groupEnd();

					ctx.stats.countFilteredOutComments(filteredOutComments);
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
