import { Localized } from '@fluent/react';
import { Button } from '@nextui-org/button';
import { useDisclosure } from '@nextui-org/modal';
import { useSignal } from '@preact/signals';
import cx from 'clsx';
import type { FunctionComponent, VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { Confirm } from '@/options/components/Confirm';
import { Editor } from '@/options/components/Editor';
import { ErrorCode } from '@/options/components/ErrorCode';
import { useLazyStorages } from '@/options/hooks/useLazyStorages';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';

import styles from './styles.module.scss';

export const BlockedTags: FunctionComponent = () => {
	const editorRef = useRef<Editor.Ref>(null);
	const { blockedTagsStorage } = useLazyStorages();
	const blockedTags = useStorageState({ storage: blockedTagsStorage });
	const isModified = useSignal(false);
	const [isSaving, setIsSaving] = useState(false);
	const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

	const saveTags = useCallback(() => {
		const value = editorRef.current?.getValue();

		if (typeof value === 'string') {
			setIsSaving(true);
			return blockedTagsStorage.setRaw(value).finally(() => setIsSaving(false));
		}
	}, []);

	const revertChanges = useCallback(() => {
		if (editorRef.current && blockedTags.status === StorageHookState.Loaded) {
			editorRef.current.setValue(blockedTags.data.raw);
		}
	}, [blockedTags]);

	useEffect(
		() => () => {
			saveTags();
		},
		[],
	);

	let content: string | VNode;

	switch (blockedTags.status) {
		case StorageHookState.Loaded: {
			content = (
				<Editor
					stateRef={editorRef}
					className={cx('w-full flex-grow', styles['blocked-tags__editor'])}
					defaultValue={blockedTags.data.raw}
					lineWrapping
					isModifiedSignal={isModified}
				/>
			);
			break;
		}

		case StorageHookState.Loading: {
			content = (
				<p className={cx('w-full flex-grow', styles['blocked-tags__editor'])}>
					<Localized id="loading" />
				</p>
			);
			break;
		}

		case StorageHookState.Error: {
			content = <ErrorCode data={blockedTags.error} />;
			break;
		}
	}

	return (
		<section className="w-full h-full flex flex-col items-start">
			{content}

			<footer className="flex-shrink-0 mt-4 flex items-center gap-4">
				<Button
					className="min-w-24"
					color={isModified.value ? 'success' : undefined}
					isLoading={isSaving}
					isDisabled={isSaving || !isModified.value}
					onPress={saveTags}
				>
					<Localized id="save" />
				</Button>

				<Button
					color={isModified.value ? 'danger' : undefined}
					variant="light"
					isDisabled={isSaving || !isModified.value}
					onPress={onOpen}
				>
					<Localized id="revert-changes" />
				</Button>

				<Confirm
					title={<Localized id="revert-blocked-tags-changes-confirmation-title" />}
					description={<Localized id="revert-blocked-tags-changes-confirmation-description" />}
					actionText={<Localized id="revert" />}
					isOpen={isOpen}
					onConfirm={revertChanges}
					onOpenChange={onOpenChange}
					onClose={onClose}
				/>
			</footer>
		</section>
	);
};
