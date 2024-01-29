import { Localized } from '@fluent/react';
import { Button } from '@nextui-org/button';
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	useDisclosure,
} from '@nextui-org/modal';
import type { FunctionComponent } from 'preact';
import { useCallback, useState } from 'preact/hooks';

interface Props {
	className?: string;
	clear: () => Promise<void>;
}

export const ClearBlockedChannels: FunctionComponent<Props> = ({ className, clear }) => {
	const [isLoading, setIsLoading] = useState(false);
	const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

	const handleClear = useCallback(() => {
		setIsLoading(true);
		clear()
			.then(onClose)
			.finally(() => setIsLoading(false));
	}, []);

	return (
		<>
			<Button className={className} variant="light" onPress={onOpen}>
				<Localized id="clear" />
			</Button>

			<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
				<ModalContent>
					{onClose => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<Localized id="clear-blocked-channels-confirmation-title" />
							</ModalHeader>

							<ModalBody>
								<Localized id="clear-blocked-channels-confirmation-description" />
							</ModalBody>

							<ModalFooter>
								<Button color="primary" onPress={onClose}>
									<Localized id="no" />
								</Button>

								<Button color="danger" variant="light" isLoading={isLoading} onPress={handleClear}>
									<Localized id="clear" />
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
};
