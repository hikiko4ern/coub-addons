import { Localized, type ReactLocalization } from '@fluent/react';
import type { VNode } from 'preact';

import { FluentList } from '@/translation/intl';

export abstract class TranslatableError extends Error {
	abstract translate(l10n: ReactLocalization): string | VNode;
}

export class StorageMigrationsFailed extends TranslatableError {
	constructor(
		readonly keys: string[],
		readonly cause: AggregateError,
	) {
		super('some migrations are failed', { cause });
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('backup-migrations-failed', {
			keys: new FluentList(this.keys, { type: 'conjunction' }),
			error: this.cause.errors.join(', '),
		});
}

export class StatesVersionMismatch extends TranslatableError {
	constructor(
		readonly key: string,
		readonly currentVersion: number,
		readonly backupVersion: number,
	) {
		super(
			`\`${key}\` current version is not equal to the backup (${currentVersion} vs ${backupVersion})`,
		);
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('storage-version-is-not-equal-to-backup', {
			key: this.key,
			currentVersion: this.currentVersion,
			backupVersion: this.backupVersion,
		});
}

export class CurrentStateIsOlderThanBackup extends TranslatableError {
	constructor(
		readonly key: string,
		readonly currentVersion: number,
		readonly backupVersion: number,
	) {
		super(`\`${key}\` version is older than backup (${currentVersion} vs ${backupVersion})`);
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('storage-version-is-older-than-backup', {
			key: this.key,
			currentVersion: this.currentVersion,
			backupVersion: this.backupVersion,
		});
}

export class MissingMigrations extends TranslatableError {
	constructor(readonly key: string) {
		super(`missing migrations for \`${key}\``);
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('storage-is-missing-migrations', { key: this.key });
}

export class MissingMigrationVersion extends TranslatableError {
	constructor(
		readonly key: string,
		readonly version: number,
	) {
		super(`missing migration for \`${key}\` for version ${version}`);
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('storage-is-missing-migration-version', {
			key: this.key,
			version: this.version,
		});
}

export class StorageMergeFailed extends TranslatableError {
	constructor(
		readonly key: string,
		readonly cause: unknown,
	) {
		super(`failed to merge \`${key}\``, { cause });
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) =>
		l10n.getString('storage-merge-failed', {
			key: this.key,
			error: String(this.cause),
		});
}

export class StorageMergesFailed extends TranslatableError {
	constructor(readonly errors: TranslatableError[]) {
		super('some merges are failed', { cause: errors });
		Object.setPrototypeOf(this, new.target.prototype);
	}

	translate = (l10n: ReactLocalization) => {
		const versionMismatchErrors = this.errors.filter(err => err instanceof StatesVersionMismatch);

		return versionMismatchErrors.length ? (
			<Localized
				id="storages-versions-are-different"
				elems={{ br: <br />, pre: <span className="whitespace-pre-line" /> }}
				vars={{ error: this.formatErrorList(l10n, versionMismatchErrors) }}
			>
				<span />
			</Localized>
		) : (
			l10n.getString('backup-merges-failed', { error: this.formatErrorList(l10n, this.errors) })
		);
	};

	private formatErrorList = (l10n: ReactLocalization, errors: TranslatableError[]) =>
		errors.map(err => `- ${err.translate(l10n)}`).join('\n');
}
