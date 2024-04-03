import { Localized } from '@fluent/react';
import { Accordion, AccordionItem } from '@nextui-org/accordion';
import { Code } from '@nextui-org/code';
import { Snippet } from '@nextui-org/snippet';
import indentString from 'indent-string';
import type { FunctionComponent } from 'preact';

interface Props {
	data: unknown;
	collapsible?: boolean;
}

export const ErrorCode: FunctionComponent<Props> = ({ data, collapsible, children }) => {
	let msg = String(data);

	if (data instanceof Error && data.stack) {
		msg += '\n';
		msg += indentString(data.stack, 1, { indent: '\t' });
	}

	const content = (
		<Snippet classNames={{ base: 'items-start', pre: 'whitespace-pre-wrap' }} fullWidth hideSymbol>
			{msg}
		</Snippet>
	);

	return (
		<>
			{children || (
				<p className="text-danger text-large dark:text-danger-500">
					<Localized id="an-error-occurred-while-loading" />
				</p>
			)}

			{collapsible ? (
				<Accordion variant="shadow">
					<AccordionItem
						classNames={{ title: 'text-center' }}
						title={<Code color="danger">{String(data)}</Code>}
						textValue={msg}
					>
						{content}
					</AccordionItem>
				</Accordion>
			) : (
				content
			)}
		</>
	);
};
