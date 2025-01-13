import type { ReactLocalization } from '@fluent/react';
import type { VNode } from 'preact';

export abstract class TranslatableError extends Error {
	abstract translate(l10n: ReactLocalization): string | VNode;
}
