import type { AddPluginConfig } from '@graphql-codegen/add';
import type { CodegenConfig } from '@graphql-codegen/cli';
import type { TypeScriptPluginConfig } from '@graphql-codegen/typescript';
import type { TypeScriptDocumentsPluginConfig } from '@graphql-codegen/typescript-operations';
import { loadConfigSync } from 'graphql-config';

const gqlConfig = loadConfigSync({
	throwOnEmpty: true,
	throwOnMissing: true,
});

export const commentsProject = gqlConfig.getProject('comments');

const typescriptConfig: TypeScriptPluginConfig = {
	strictScalars: true,
	defaultScalarType: 'unknown',
	scalars: {
		ISO8601DateTime: 'string',
	},
	skipTypename: true,
	useTypeImports: true,
	inlineFragmentTypes: 'combine',
	declarationKind: 'interface',
	printFieldsOnNewLines: true,
};

const typescriptOperationsConfig: TypeScriptDocumentsPluginConfig = {
	arrayInputCoercion: false,
};

const config = {
	ignoreNoDocuments: true,
	generates: {
		'./src/gql/comments/graphql.ts': {
			schema: commentsProject.schema,
			documents: commentsProject.documents,
			plugins: [
				{ add: { content: '/* eslint-disable */' } satisfies AddPluginConfig },
				{ typescript: {} },
				{ 'typescript-operations': {} },
			],
			config: {
				...typescriptConfig,
				...typescriptOperationsConfig,
			},
		},
	},
} satisfies CodegenConfig;

export default config;
