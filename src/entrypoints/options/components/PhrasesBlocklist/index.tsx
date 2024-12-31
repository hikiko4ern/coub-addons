import { Localized } from '@fluent/react';
import { Button } from '@nextui-org/button';
import { Input } from '@nextui-org/input';
import { useDisclosure } from '@nextui-org/modal';
import { useSignal } from '@preact/signals';
import cx from 'clsx';
import type { FunctionComponent, VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { usePrevious } from '@/hooks/usePrevious';
import { Confirm } from '@/options/components/Confirm';
import { Editor } from '@/options/components/Editor';
import { ErrorCode } from '@/options/components/ErrorCode';
import { HintTooltip } from '@/options/components/HintTooltip';
import { StorageHookState, useStorageState } from '@/options/hooks/useStorageState';
import type { PhrasesBlocklistStorage } from '@/storage/phrasesBlocklist';
import { phrasesBlocklist, phrasesBlocklistLinter } from './grammar';
import { useTestPhrasesBlocklist } from './hooks/useTestPhrasesBlocklist';

import styles from './styles.module.scss';

const lang = phrasesBlocklist();

interface Props {
	storage: PhrasesBlocklistStorage<string>;
}

export const PhrasesBlocklist: FunctionComponent<Props> = ({ storage }) => {
	const editorRef = useRef<Editor.Ref>(null);
	const storageState = useStorageState({ storage });
	const isModified = useSignal(false);
	const [isSaving, setIsSaving] = useState(false);
	const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

	const storageRaw = storageState.status === StorageHookState.Loaded && storageState.data.raw;
	const prevStorageRaw = usePrevious(storageRaw);

	const { testQuery, isTestQueryMatched, handleTestQueryInput, clearTestQuery } =
		useTestPhrasesBlocklist({
			storage,
			raw: storageRaw,
			onMatch: pos => editorRef.current?.highlightLine(pos),
		});

	const save = useCallback((value: string) => {
		setIsSaving(true);
		return storage.setRaw(value).finally(() => setIsSaving(false));
	}, []);

	const revertChanges = useCallback(() => {
		if (editorRef.current && storageState.status === StorageHookState.Loaded) {
			editorRef.current.setValue(storageState.data.raw);
		}
	}, [storageState]);

	const handleSaveClick = useCallback(() => {
		const value = editorRef.current?.getValue();
		return typeof value === 'string' && save(value);
	}, []);

	useEffect(
		() => () => {
			const value = editorRef.current?.getValue();
			typeof value === 'string' && save(value);
		},
		[],
	);

	useEffect(() => {
		typeof prevStorageRaw === 'string' &&
			typeof storageRaw === 'string' &&
			prevStorageRaw !== storageRaw &&
			editorRef.current &&
			editorRef.current.getValue() === prevStorageRaw &&
			editorRef.current.setValue(storageRaw);
	}, [prevStorageRaw, storageRaw]);

	let content: string | VNode;

	switch (storageState.status) {
		case StorageHookState.Loaded: {
			content = (
				<Editor
					stateRef={editorRef}
					className={cx('h-0 w-full flex-grow', styles['phrases-blocklist__editor'])}
					defaultValue={storageState.data.raw}
					lineWrapping
					lineHighlighting
					isModifiedSignal={isModified}
					language={lang}
					linter={phrasesBlocklistLinter}
					save={save}
				/>
			);
			break;
		}

		case StorageHookState.Loading: {
			content = (
				<p className={cx('w-full flex-grow', styles['phrases-blocklist__editor'])}>
					<Localized id="loading" />
				</p>
			);
			break;
		}

		case StorageHookState.Error: {
			content = <ErrorCode data={storageState.error} />;
			break;
		}
	}

	return (
		<section className="flex h-full w-full flex-col items-start">
			{content}

			<footer className="mt-4 flex w-full flex-shrink-0 justify-between gap-4">
				<section className="flex flex-shrink-0 items-center gap-4">
					<Button
						className="min-w-24"
						color={isModified.value ? 'success' : undefined}
						isLoading={isSaving}
						isDisabled={isSaving || !isModified.value}
						onPress={handleSaveClick}
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
				</section>

				<section className="flex grow items-baseline justify-end gap-2">
					<Localized id="phrases-tester" attrs={{ placeholder: true }}>
						<Input
							classNames={{
								base: 'w-auto grow justify-end',
								mainWrapper: 'min-w-[min(theme(spacing.96),100%)]',
							}}
							name="test"
							labelPlacement="outside-left"
							fullWidth={false}
							isClearable
							value={testQuery}
							color={
								testQuery && !isModified.value
									? isTestQueryMatched
										? 'success'
										: 'danger'
									: undefined
							}
							isDisabled={isModified.value}
							onValueChange={handleTestQueryInput}
							onClear={clearTestQuery}
						/>
					</Localized>

					<HintTooltip className="shrink-0" placement="left">
						<Localized id="phrases-tester-description" />
					</HintTooltip>
				</section>

				<Confirm
					title={<Localized id="revert-changes-confirmation-title" />}
					description={<Localized id="revert-changes-confirmation-description" />}
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
