import type { MakeMaybe } from '@/gql/comments/graphql';

export interface GraphqlRequest<Vars extends object> {
	query: string;
	variables?: Vars;
	operationName?: string;
}

export interface GraphqlSuccessfulResponse<Data extends object> {
	data: Data;
}

export interface GraphqlResponseWithErrors<Data extends object> {
	data?: MakeMaybe<Data, keyof Data>;
	errors: unknown[];
}

export type GraphqlResponse<Data extends object> =
	| GraphqlSuccessfulResponse<Data>
	| GraphqlResponseWithErrors<Data>;
