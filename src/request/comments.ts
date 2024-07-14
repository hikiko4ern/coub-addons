import type { EntityCommentsQuery } from '@/gql/comments/graphql';
import { isObject } from '@/helpers/isObject';
import type { BlockedChannelData } from '@/storage/blockedChannels';
import type { Logger } from '@/utils/logger';
import type { Context } from './ctx';
import { CommentExclusionReason } from './types/comment';

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
	ctx.webRequest.rewriteCompleteGraphql<EntityCommentsQuery>({
		name: 'comments handler',
		filter: {
			urls: [`${ctx.commentsOrigin}/graphql`],
			types: ['xmlhttprequest'],
		},
		// NOTE: as of July 10, 2024, the `threadComments` request is not present in `disqus-3d9410fccc8802be8a3b.js`
		// fyi: Coub uses Apollo Client (v3.7.10 at the time of writing; https://www.apollographql.com/docs/react)
		ifQueriesFields: ['entityComments'],
		rewrite: async ({ ctx, logger, details, data }) => {
			let isModified = false;
			const { entityComments } = data;

			if (
				isObject(entityComments) &&
				Array.isArray(entityComments.comments) &&
				entityComments.comments.length > 0
			) {
				ctx.blockedChannels
					.actualizeChannelsData(iterAsBlockedChannels(logger, entityComments.comments))
					.catch((err: unknown) => logger.error('failed to actualize blocked channels data', err));

				{
					const isHide = await ctx.blocklist.isHideCommentsFromBlockedChannels();

					if (!isHide) {
						logger.debug('ignoring comments response due to isHideCommentsFromBlockedChannels =');
						return;
					}
				}

				const origAmount = entityComments.comments.length;

				const filteredComments: (typeof entityComments)['comments'] = [];
				const filteredOutComments: FilteredOutComment[] = [];

				const checker = await ctx.blocklistUtils.createChecker();

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
	logger: Logger,
	comments: EntityCommentsQuery['entityComments']['comments'],
): Generator<BlockedChannelData, void, never> {
	for (const comment of comments) {
		if (
			isObject(comment) &&
			isObject(comment.author) &&
			typeof comment.author.coubcomChannelId === 'string' &&
			typeof comment.author.name === 'string' &&
			typeof comment.author.profileUrl === 'string' &&
			comment.author.profileUrl
		) {
			const id = Number.parseInt(comment.author.coubcomChannelId, 10);
			const permalink = getPermalinkFromUrl(logger, comment.author.profileUrl);

			if (!Number.isNaN(id) && permalink) {
				yield {
					id,
					title: comment.author.name,
					permalink,
				};
			}
		}
	}
}

const getPermalinkFromUrl = (logger: Logger, profileUrl: string) => {
	try {
		const url = new URL(profileUrl);
		return url.pathname.slice(1);
	} catch (err) {
		logger.error('failed to parse `profileUrl`', err);
	}
};
