import { Localized } from '@fluent/react';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import { Button } from '@nextui-org/button';
import { Tooltip } from '@nextui-org/tooltip';
import type { FunctionComponent } from 'preact';
import { useCallback, useState } from 'preact/hooks';

interface Props {
	id: number;
	onRemove: (id: number) => Promise<void>;
}

export const Actions: FunctionComponent<Props> = ({ id, onRemove }) => {
	const [isRemoving, setIsRemoving] = useState(false);

	const remove = useCallback(() => {
		setIsRemoving(true);
		onRemove(id).finally(() => setIsRemoving(false));
	}, [id, onRemove]);

	return (
		<div className="flex justify-center items-center gap-2">
			<Localized id="remove-from-blocklist" attrs={{ content: true }}>
				<Tooltip color="danger">
					<Button
						isIconOnly
						color="danger"
						size="sm"
						variant="light"
						isLoading={isRemoving}
						isDisabled={isRemoving}
						onPress={remove}
					>
						<TrashIcon className="w-5 h-5" />
					</Button>
				</Tooltip>
			</Localized>
		</div>
	);
};
