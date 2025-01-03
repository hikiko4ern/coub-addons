/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  ISO8601DateTime: { input: string; output: string; }
}

export interface Author {
  avatar?: Maybe<Scalars['String']['output']>;
  channelId?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  permalink?: Maybe<Scalars['String']['output']>;
}

export interface Comment {
  author?: Maybe<Author>;
  createdAt: Scalars['ISO8601DateTime']['output'];
  hasChildren: Scalars['Boolean']['output'];
  id: Scalars['Int']['output'];
  isDeleted: Scalars['Boolean']['output'];
  isEdited: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  parentCommentId?: Maybe<Scalars['Int']['output']>;
}

export interface Comments {
  comments: Array<Comment>;
  meta: Meta;
}

/** Autogenerated input type of CreateCommentReport */
export interface CreateCommentReportInput {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  commentId: Scalars['ID']['input'];
}

/** Autogenerated input type of CreateEntityComment */
export interface CreateEntityCommentInput {
  channelId: Scalars['Int']['input'];
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  entityId: Scalars['Int']['input'];
  entityType: Entity;
  message: Scalars['String']['input'];
  parentCommentId?: InputMaybe<Scalars['Int']['input']>;
}

export enum Entity {
  Coub = 'COUB',
  Story = 'STORY'
}

export interface Meta {
  page: Scalars['Int']['output'];
  perPage: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
}

export interface Mutation {
  createCommentReport: Comment;
  createEntityComment: Comment;
  removeComment: RemovedComment;
  updateComment: Comment;
}


export interface MutationCreateCommentReportArgs {
  input: CreateCommentReportInput;
}


export interface MutationCreateEntityCommentArgs {
  input: CreateEntityCommentInput;
}


export interface MutationRemoveCommentArgs {
  input: RemoveCommentInput;
}


export interface MutationUpdateCommentArgs {
  input: UpdateCommentInput;
}

export interface Query {
  /** Get comment replies */
  commentReplies: Comments;
  /** Get entity comments */
  entityComments: Comments;
}


export interface QueryCommentRepliesArgs {
  page: Scalars['Int']['input'];
  parentCommentId: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryEntityCommentsArgs {
  entityId: Scalars['Int']['input'];
  entityType: Entity;
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
}

/** Autogenerated input type of RemoveComment */
export interface RemoveCommentInput {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  commentId: Scalars['Int']['input'];
}

export interface RemovedComment {
  id: Scalars['Int']['output'];
}

/** Autogenerated input type of UpdateComment */
export interface UpdateCommentInput {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  commentId: Scalars['Int']['input'];
  message: Scalars['String']['input'];
}

export type CommentFieldsFragment = {
  __typename: 'Comment',
  id: number,
  createdAt: string,
  hasChildren: boolean,
  isDeleted: boolean,
  isEdited: boolean,
  message?: string | null,
  parentCommentId?: number | null,
  author?: {
    __typename: 'Author',
    avatar?: string | null,
    channelId?: string | null,
    name?: string | null,
    permalink?: string | null
  } | null
};

export type RepliesQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  parentCommentId: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
}>;


export type RepliesQuery = {
  commentReplies: {
    __typename: 'Comments',
    comments: Array<(
      {
      __typename: 'Comment'
    }
      & CommentFieldsFragment
    )>,
    meta: {
      __typename: 'Meta',
      page: number,
      perPage: number,
      totalPages: number
    }
  }
};

export type CommentsQueryVariables = Exact<{
  entityId: Scalars['Int']['input'];
  entityType: Entity;
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
}>;


export type CommentsQuery = {
  entityComments: {
    __typename: 'Comments',
    comments: Array<(
      {
      __typename: 'Comment'
    }
      & CommentFieldsFragment
    )>,
    meta: {
      __typename: 'Meta',
      page: number,
      perPage: number,
      totalPages: number
    }
  }
};
