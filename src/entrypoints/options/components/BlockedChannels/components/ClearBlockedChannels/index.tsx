import { Localized } from '@fluent/react';
import { Button } from '@nextui-org/button';
import { useDisclosure } from '@nextui-org/modal';
import type { FunctionComponent } from 'preact';

import { Confirm } from '@/options/components/Confirm';

interface Props {
	className?: string;
	clear: () => Promise<void>;
}

export const ClearBlockedChannels: FunctionComponent<Props> = ({ className, clear }) => {
	const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

	return (
		<>
			<Button className={className} variant="light" onPress={onOpen}>
				<Localized id="clear" />
			</Button>

			<Confirm
				title={<Localized id="clear-blocked-channels-confirmation-title" />}
				description={<Localized id="clear-blocked-channels-confirmation-description" />}
				actionText={<Localized id="clear" />}
				isOpen={isOpen}
				onConfirm={clear}
				onOpenChange={onOpenChange}
				onClose={onClose}
			/>
		</>
	);
};
