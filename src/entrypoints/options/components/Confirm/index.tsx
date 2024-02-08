import { Localized } from '@fluent/react';
import { Button } from '@nextui-org/button';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/modal';
import type { ComponentChildren, FunctionComponent } from 'preact';
import { useCallback, useState } from 'preact/hooks';

interface Props {
	className?: string;
	title: ComponentChildren;
	description: ComponentChildren;
	actionText: ComponentChildren;
	isOpen: boolean;
	onConfirm: () => Promise<void> | void;
	onOpenChange: () => void;
	onClose: () => void;
}

export const Confirm: FunctionComponent<Props> = ({
	title,
	description,
	actionText,
	isOpen,
	onConfirm,
	onOpenChange,
	onClose,
}) => {
	const [isLoading, setIsLoading] = useState(false);

	const handleClear = useCallback(() => {
		const promise = onConfirm();

		if (typeof promise === 'undefined') {
			onClose();
		} else {
			setIsLoading(true);
			promise.then(onClose).finally(() => setIsLoading(false));
		}
	}, [onConfirm, onClose]);

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
			<ModalContent>
				{onClose => (
					<>
						<ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>

						<ModalBody>{description}</ModalBody>

						<ModalFooter>
							<Button color="primary" onPress={onClose}>
								<Localized id="no" />
							</Button>

							<Button color="danger" variant="light" isLoading={isLoading} onPress={handleClear}>
								{actionText}
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
};
