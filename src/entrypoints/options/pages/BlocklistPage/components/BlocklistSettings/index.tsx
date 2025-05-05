import { Localized } from '@fluent/react';
import { Button } from '@nextui-org/button';
import { Checkbox } from '@nextui-org/checkbox';
import { Select, SelectItem } from '@nextui-org/select';
import type { Selection } from '@react-types/shared';
import cx from 'clsx';
import type { FunctionComponent } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { toast } from 'react-toastify';
import type { Permissions } from 'wxt/browser';

import { logger } from '@/options/constants';
import { useLocalizationContext } from '@/options/hooks/useLocalizationContext';
import { useStorageMergeCallback } from '@/options/hooks/useStorageMergeCallback';
import { useT } from '@/options/hooks/useT';
import {
	ARE_COMMENTS_ON_DIFFERENT_HOST,
	COMMENTS_GRAPHQL_HOST,
	COMMENTS_GRAPHQL_PERMISSIONS,
} from '@/permissions/constants';
import type { BlocklistStorage, ReadonlyBlocklist } from '@/storage/blocklist';
import { CommentFromBlockedChannelAction } from '@/storage/blocklist';

interface Props {
	storage: BlocklistStorage;
	state: ReadonlyBlocklist;
}

const COMMENT_FROM_BLOCKED_CHANNEL_ACTIONS = Object.values(CommentFromBlockedChannelAction);

export const BlocklistSettings: FunctionComponent<Props> = ({ storage, state }) => {
	const t = useT();
	const { locale } = useLocalizationContext();

	const [haveAccessToComments, setHaveAccessToComments] = useState<boolean>();
	const commentsFromBlockedChannelsSelectedKeys = useMemo(
		() => [state.commentsFromBlockedChannels],
		[state.commentsFromBlockedChannels],
	);

	if (ARE_COMMENTS_ON_DIFFERENT_HOST) {
		useEffect(() => {
			browser.permissions.contains(COMMENTS_GRAPHQL_PERMISSIONS).then(setHaveAccessToComments);

			const handler = (type: 'added' | 'removed', permissions: Permissions.Permissions) => {
				logger.debug(type, 'permissions', permissions);

				if (permissions.origins?.includes(COMMENTS_GRAPHQL_HOST)) {
					setHaveAccessToComments(type === 'added');
				}
			};

			const addedHandler = (permissions: Permissions.Permissions) => handler('added', permissions);
			const removedHandler = (permissions: Permissions.Permissions) =>
				handler('removed', permissions);

			browser.permissions.onAdded.addListener(addedHandler);
			browser.permissions.onRemoved.addListener(removedHandler);

			return () => {
				browser.permissions.onRemoved.removeListener(removedHandler);
				browser.permissions.onAdded.removeListener(addedHandler);
			};
		}, []);
	}

	const requestAccessToComments = ARE_COMMENTS_ON_DIFFERENT_HOST
		? useCallback(() => {
				browser.permissions
					.request(COMMENTS_GRAPHQL_PERMISSIONS)
					.then(isGranted =>
						isGranted
							? setHaveAccessToComments(true)
							: toast.warn(
									<Localized id="permissions-must-be-granted-for-this-functionality-to-work" />,
								),
					);
			}, [])
		: undefined;

	const handleIsBlockRecoubsChange = useStorageMergeCallback(storage, 'isBlockRecoubs');

	const handleIsBlockRepostsOfCoubsChange = useStorageMergeCallback(
		storage,
		'isBlockRepostsOfCoubs',
	);

	const handleIsBlockRepostsOfStoriesChange = useStorageMergeCallback(
		storage,
		'isBlockRepostsOfStories',
	);

	const setCommentsFromBlockedChannels = useStorageMergeCallback(
		storage,
		'commentsFromBlockedChannels',
		typeof requestAccessToComments === 'function'
			? action => {
					action !== CommentFromBlockedChannelAction.Show &&
						!haveAccessToComments &&
						requestAccessToComments();
				}
			: undefined,
	);

	const handleCommentsFromBlockedChannelsChange = useCallback(
		(keys: Selection) => {
			if (keys === 'all') {
				return;
			}

			const item = keys.values().next();

			if (item.done) {
				return;
			}

			setCommentsFromBlockedChannels(item.value as CommentFromBlockedChannelAction);
		},
		[setCommentsFromBlockedChannels],
	);

	return (
		<div className="flex flex-col flex-wrap gap-4">
			<Checkbox isSelected={state.isBlockRecoubs} onValueChange={handleIsBlockRecoubsChange}>
				<Localized id="block-recoubs" />
			</Checkbox>

			<Checkbox
				isSelected={state.isBlockRepostsOfCoubs}
				onValueChange={handleIsBlockRepostsOfCoubsChange}
			>
				<Localized id="block-reposts-of-coubs" />
			</Checkbox>

			<Checkbox
				isSelected={state.isBlockRepostsOfStories}
				onValueChange={handleIsBlockRepostsOfStoriesChange}
			>
				<Localized id="block-reposts-of-stories" />
			</Checkbox>

			<div
				className={cx('flex gap-2', {
					'min-h-8': haveAccessToComments === false,
				})}
			>
				<Localized id="comments-from-blocked-channels" attrs={{ label: true }}>
					<Select
						className="items-center"
						classNames={{
							mainWrapper: cx('w-[calc(theme(spacing.60)+theme(spacing.2))]', {
								'!w-[calc(theme(spacing.80)+theme(spacing.2))]': locale === 'ru-RU',
							}),
						}}
						labelPlacement="outside-left"
						fullWidth={false}
						selectedKeys={commentsFromBlockedChannelsSelectedKeys}
						scrollShadowProps={{ isEnabled: false }}
						onSelectionChange={handleCommentsFromBlockedChannelsChange}
					>
						{COMMENT_FROM_BLOCKED_CHANNEL_ACTIONS.map(value => (
							<SelectItem key={value}>
								{t('comments-from-blocked-channels', { attr: value })}
							</SelectItem>
						))}
					</Select>
				</Localized>

				{ARE_COMMENTS_ON_DIFFERENT_HOST &&
					state.commentsFromBlockedChannels !== CommentFromBlockedChannelAction.Show &&
					haveAccessToComments === false && (
						<Button color="warning" variant="flat" size="sm" onPress={requestAccessToComments}>
							<Localized id="grant-permissions" />
						</Button>
					)}
			</div>
		</div>
	);
};
