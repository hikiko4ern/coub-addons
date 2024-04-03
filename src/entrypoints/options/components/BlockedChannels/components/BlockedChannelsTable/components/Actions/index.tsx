import { Localized } from '@fluent/react';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import { Button } from '@nextui-org/button';
import { Tooltip } from '@nextui-org/tooltip';
import { useSignal } from '@preact/signals';
import type { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';

interface Props {
	id: number;
	onRemove: (id: number) => Promise<void>;
}

export const Actions: FunctionComponent<Props> = ({ id, onRemove }) => {
	const isRemoving = useSignal(false);

	const remove = useCallback(() => {
		isRemoving.value = true;
		onRemove(id).finally(() => (isRemoving.value = false));
	}, [id, onRemove]);

	return (
		<div className="flex items-center justify-center gap-2">
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
