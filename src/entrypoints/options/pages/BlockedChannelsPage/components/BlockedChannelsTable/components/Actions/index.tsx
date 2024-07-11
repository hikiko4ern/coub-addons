import { fetchChannelData } from '@/api/channel';
import { logger } from '@/options/constants';
import type { BlockedChannelsStorage } from '@/storage/blockedChannels';
import { Localized } from '@fluent/react';
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import { Button } from '@nextui-org/button';
import { Tooltip } from '@nextui-org/tooltip';
import { useSignal } from '@preact/signals';
import type { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { toast } from 'react-toastify';

interface Props {
	storage: BlockedChannelsStorage;
	id: number;
	onRemove: (id: number) => Promise<void>;
}

export const Actions: FunctionComponent<Props> = ({ storage, id, onRemove }) => {
	const isUpdatingData = useSignal(false);
	const isRemoving = useSignal(false);

	const updateData = useCallback(() => {
		isUpdatingData.value = true;

		fetchChannelData(id)
			.then(channel =>
				storage.actualizeChannelData({
					id: channel.id,
					title: channel.title,
					permalink: channel.permalink,
				}),
			)
			.then(() =>
				toast.success(<Localized id="channel-data-has-been-updated" />, { autoClose: 2000 }),
			)
			.catch((err: unknown) => {
				logger.error('failed to actualize channel data', err);
				toast.error(
					<Localized
						id="channel-data-update-error"
						elems={{ br: <br /> }}
						vars={{ error: String(err) }}
					/>,
				);
			})
			.finally(() => (isUpdatingData.value = false));
	}, [id, storage]);

	const remove = useCallback(() => {
		isRemoving.value = true;
		onRemove(id).finally(() => (isRemoving.value = false));
	}, [id, onRemove]);

	return (
		<div className="flex items-center justify-center gap-2">
			<Localized id="update-channel-data" attrs={{ content: true }}>
				<Tooltip>
					<Button
						isIconOnly
						size="sm"
						variant="light"
						isLoading={isUpdatingData.value}
						isDisabled={isUpdatingData.value}
						onPress={updateData}
					>
						<ArrowPathIcon className="h-5 w-5" />
					</Button>
				</Tooltip>
			</Localized>

			<Localized id="remove-from-blocklist" attrs={{ content: true }}>
				<Tooltip color="danger">
					<Button
						isIconOnly
						color="danger"
						size="sm"
						variant="light"
						isLoading={isRemoving.value}
						isDisabled={isRemoving.value}
						onPress={remove}
					>
						<TrashIcon className="h-5 w-5" />
					</Button>
				</Tooltip>
			</Localized>
		</div>
	);
};
