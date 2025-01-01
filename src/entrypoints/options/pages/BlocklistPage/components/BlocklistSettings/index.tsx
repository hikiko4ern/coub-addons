import { Localized } from '@fluent/react';
import { Button } from '@nextui-org/button';
import { Checkbox } from '@nextui-org/checkbox';
import cx from 'clsx';
import type { FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { toast } from 'react-toastify';
import type { Permissions } from 'wxt/browser';

import { useWatchingRef } from '@/hooks/useWatchingRef';
import { logger } from '@/options/constants';
import {
	ARE_COMMENTS_ON_DIFFERENT_HOST,
	COMMENTS_GRAPHQL_HOST,
	COMMENTS_GRAPHQL_PERMISSIONS,
} from '@/permissions/constants';
import type { Blocklist, BlocklistStorage, ReadonlyBlocklist } from '@/storage/blocklist';

interface Props {
	storage: BlocklistStorage;
	state: ReadonlyBlocklist;
}

const useMergeCallback = <Key extends keyof Blocklist>(
	storage: BlocklistStorage,
	key: Key,
	onChange?: (value: Blocklist[Key]) => void,
) => {
	const onChangeRef = useWatchingRef(onChange);

	return useCallback(
		(value: Blocklist[Key]) => {
			storage.mergeWith({ [key]: value });
			typeof onChangeRef.current === 'function' && onChangeRef.current(value);
		},
		[storage, key],
	);
};

export const BlocklistSettings: FunctionComponent<Props> = ({ storage, state }) => {
	const [haveAccessToComments, setHaveAccessToComments] = useState<boolean>();

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

	const handleIsBlockRecoubsChange = useMergeCallback(storage, 'isBlockRecoubs');

	const handleIsBlockRepostsOfStoriesChange = useMergeCallback(storage, 'isBlockRepostsOfStories');

	const handleIsHideCommentsFromBlockedChannelsChange = useMergeCallback(
		storage,
		'isHideCommentsFromBlockedChannels',
		typeof requestAccessToComments === 'function'
			? isHide => {
					isHide && !haveAccessToComments && requestAccessToComments();
				}
			: undefined,
	);

	return (
		<div className="flex flex-col flex-wrap gap-4">
			<Checkbox isSelected={state.isBlockRecoubs} onValueChange={handleIsBlockRecoubsChange}>
				<Localized id="block-recoubs" />
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
				<Checkbox
					isSelected={state.isHideCommentsFromBlockedChannels}
					onValueChange={handleIsHideCommentsFromBlockedChannelsChange}
				>
					<Localized id="hide-comments-from-blocked-channels" />
				</Checkbox>

				{ARE_COMMENTS_ON_DIFFERENT_HOST &&
					state.isHideCommentsFromBlockedChannels &&
					haveAccessToComments === false && (
						<Button color="warning" variant="flat" size="sm" onPress={requestAccessToComments}>
							<Localized id="grant-permissions" />
						</Button>
					)}
			</div>
		</div>
	);
};
