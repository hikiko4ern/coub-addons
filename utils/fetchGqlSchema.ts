import fs from 'node:fs/promises';
import path from 'node:path';
import { inspect } from 'node:util';
import {
	type ExecutionResult,
	type IntrospectionQuery,
	assertValidSchema,
	buildClientSchema,
	getIntrospectionQuery,
} from 'graphql';
import type { GraphQLProjectConfig } from 'graphql-config';
import type { ObjMap } from 'graphql/jsutils/ObjMap';

import { commentsProject } from './gqlCodegen';

(async () => {
	if (!process.env.VITE_COUB_COMMENTS_ORIGIN) {
		throw new Error('`process.env.VITE_COUB_COMMENTS_ORIGIN` is missing');
	}
	const schemaPath = getSchemaPath(commentsProject.schema);

	const response = await fetch(`${process.env.VITE_COUB_COMMENTS_ORIGIN}/graphql`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			query: getIntrospectionQuery(),
		}),
	});

	const data = validateResponse((await response.json()) as ExecutionResult<IntrospectionQuery>);

	assertValidSchema(buildClientSchema(data.data));

	await fs.mkdir(path.dirname(schemaPath), { recursive: true });
	await fs.writeFile(schemaPath, JSON.stringify(data, null, 2), { encoding: 'utf8' });

	console.log('wrote', path.resolve(schemaPath));
})().catch(err => {
	console.error(err);
	process.exit(1);
});

// helpers

interface SuccessfulExecutionResult<TData, TExtensions = ObjMap<unknown>>
	extends ExecutionResult<TData, TExtensions> {
	errors?: never;
	data: TData;
	extensions?: TExtensions;
}

function validateResponse<TData, TExtensions = ObjMap<unknown>>(
	data: ExecutionResult<TData, TExtensions>,
): SuccessfulExecutionResult<TData, TExtensions> {
	if (Array.isArray(data.errors)) {
		// eslint-disable-next-line @typescript-eslint/no-throw-literal
		throw data.errors;
	}

	return data as SuccessfulExecutionResult<TData, TExtensions>;
}

function getSchemaPath(schema: GraphQLProjectConfig['schema']): string {
	if (Array.isArray(schema) && typeof schema[0] === 'string') {
		return schema[0];
	}

	if (typeof schema === 'string') {
		return schema;
	}

	throw new TypeError(`expected schema path to be a string: ${inspect(schema)}`);
}
