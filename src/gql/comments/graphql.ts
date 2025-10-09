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
  ISO8601Date: { input: string; output: string; }
  ISO8601DateTime: { input: string; output: string; }
  JSON: { input: unknown; output: unknown; }
}

export enum AbuseReason {
  AdultContent = 'ADULT_CONTENT',
  Duplicate = 'DUPLICATE',
  Explicit = 'EXPLICIT',
  Offensive = 'OFFENSIVE',
  Other = 'OTHER',
  Sex = 'SEX',
  Shock = 'SHOCK',
  Spam = 'SPAM',
  Violence = 'VIOLENCE',
  WrongCommunity = 'WRONG_COMMUNITY'
}

export interface AbusedClipsFilters {
  abuseReason?: InputMaybe<AbuseReason>;
  createdAtFrom?: InputMaybe<Scalars['ISO8601Date']['input']>;
  createdAtTo?: InputMaybe<Scalars['ISO8601Date']['input']>;
  withoutAgeRestricted?: InputMaybe<Scalars['Boolean']['input']>;
  withoutPopularBanned?: InputMaybe<Scalars['Boolean']['input']>;
}

export enum AbusedClipsOrder {
  AbusedAtAsc = 'ABUSED_AT_ASC',
  AbusedAtDesc = 'ABUSED_AT_DESC',
  AbusesCountAsc = 'ABUSES_COUNT_ASC',
  AbusesCountDesc = 'ABUSES_COUNT_DESC',
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC'
}

export enum Action {
  AgeRestrict = 'AGE_RESTRICT',
  Approve = 'APPROVE',
  Ban = 'BAN',
  PopularBan = 'POPULAR_BAN'
}

export interface Author {
  avatar?: Maybe<Scalars['String']['output']>;
  channelId?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  permalink?: Maybe<Scalars['String']['output']>;
}

export enum BanReason {
  Advertising = 'ADVERTISING',
  CopyrightOrDmca = 'COPYRIGHT_OR_DMCA',
  Duplicate = 'DUPLICATE',
  Hacking = 'HACKING',
  LoudSound = 'LOUD_SOUND',
  NegativeFeelings = 'NEGATIVE_FEELINGS',
  PublicAuthoritiesClaim = 'PUBLIC_AUTHORITIES_CLAIM',
  SexualContent = 'SEXUAL_CONTENT',
  SpamOrFlood = 'SPAM_OR_FLOOD',
  Static = 'STATIC',
  SymbolsOrActions = 'SYMBOLS_OR_ACTIONS',
  ThirdPartyLinks = 'THIRD_PARTY_LINKS',
  ToxicOrHate = 'TOXIC_OR_HATE',
  UserComplaints = 'USER_COMPLAINTS',
  Violence = 'VIOLENCE',
  Watermarks = 'WATERMARKS'
}

export interface Clip {
  ageRestricted: Scalars['Boolean']['output'];
  channel: ClipsChannel;
  commentsCount: Scalars['Int']['output'];
  commentsEnabled: Scalars['Boolean']['output'];
  createdAt: Scalars['ISO8601DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  isBookmarked: Scalars['Boolean']['output'];
  isDisliked: Scalars['Boolean']['output'];
  isLiked: Scalars['Boolean']['output'];
  likesCount: Scalars['Int']['output'];
  permalink: Scalars['String']['output'];
  song?: Maybe<Scalars['Int']['output']>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  title?: Maybe<Scalars['String']['output']>;
  titleDetectedLanguage?: Maybe<Scalars['String']['output']>;
  titleTranslations?: Maybe<Scalars['JSON']['output']>;
  uploadState?: Maybe<Scalars['String']['output']>;
  viewsCount: Scalars['Int']['output'];
  vodImageUrl?: Maybe<Scalars['String']['output']>;
  vodVideoId: Scalars['String']['output'];
  vodVideoMeta?: Maybe<Scalars['JSON']['output']>;
  vodVideoUrl: Scalars['String']['output'];
}

export interface ClipPage {
  channelId: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
}

export enum ClipUploadState {
  Draft = 'DRAFT',
  Public = 'PUBLIC'
}

export interface Clips {
  clips: Array<Clip>;
  meta: Meta;
}

export interface ClipsChannel {
  avatar?: Maybe<Scalars['String']['output']>;
  followersCount: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  isFollowed: Scalars['Boolean']['output'];
  name?: Maybe<Scalars['String']['output']>;
  permalink: Scalars['String']['output'];
}

export interface ClipsChannels {
  channels: Array<ClipsChannel>;
  meta: Meta;
}

export enum ClipsOrder {
  Newest = 'NEWEST',
  Oldest = 'OLDEST',
  Random = 'RANDOM'
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

/** Autogenerated input type of CreateAbuse */
export interface CreateAbuseInput {
  claimText?: InputMaybe<Scalars['String']['input']>;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  clipId: Scalars['Int']['input'];
  reason: AbuseReason;
}

/** Autogenerated return type of CreateAbuse. */
export interface CreateAbusePayload {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
}

/** Autogenerated input type of CreateBookmark */
export interface CreateBookmarkInput {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  clipId: Scalars['Int']['input'];
}

/** Autogenerated input type of CreateClipDislike */
export interface CreateClipDislikeInput {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  clipId: Scalars['Int']['input'];
}

/** Autogenerated input type of CreateClip */
export interface CreateClipInput {
  ageRestricted?: InputMaybe<Scalars['Boolean']['input']>;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  commentsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
  uploadState?: InputMaybe<ClipUploadState>;
  vodImageUrl?: InputMaybe<Scalars['String']['input']>;
  vodVideoId: Scalars['String']['input'];
  vodVideoMeta: Scalars['JSON']['input'];
  vodVideoUrl: Scalars['String']['input'];
}

/** Autogenerated input type of CreateClipLike */
export interface CreateClipLikeInput {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  clipId: Scalars['Int']['input'];
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

/** Autogenerated input type of EditorUpdateClip */
export interface EditorUpdateClipInput {
  actionType: Action;
  banReason?: InputMaybe<BanReason>;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  clipId: Scalars['Int']['input'];
}

export enum Entity {
  Clip = 'CLIP',
  Coub = 'COUB',
  Story = 'STORY'
}

export interface Meta {
  page: Scalars['Int']['output'];
  perPage: Scalars['Int']['output'];
  totalPages?: Maybe<Scalars['Int']['output']>;
}

export interface Mutation {
  createClip: Clip;
  createClipAbuse?: Maybe<CreateAbusePayload>;
  createClipBookmark: Clip;
  createClipDislike: Clip;
  createClipLike: Clip;
  createCommentReport: Comment;
  createEntityComment: Comment;
  editorUpdateClip: Clip;
  removeClip?: Maybe<RemoveClipPayload>;
  removeClipBookmark: Clip;
  removeClipDislike: Clip;
  removeClipLike: Clip;
  removeComment: RemovedComment;
  updateClip: Clip;
  updateComment: Comment;
}


export interface MutationCreateClipArgs {
  input: CreateClipInput;
}


export interface MutationCreateClipAbuseArgs {
  input: CreateAbuseInput;
}


export interface MutationCreateClipBookmarkArgs {
  input: CreateBookmarkInput;
}


export interface MutationCreateClipDislikeArgs {
  input: CreateClipDislikeInput;
}


export interface MutationCreateClipLikeArgs {
  input: CreateClipLikeInput;
}


export interface MutationCreateCommentReportArgs {
  input: CreateCommentReportInput;
}


export interface MutationCreateEntityCommentArgs {
  input: CreateEntityCommentInput;
}


export interface MutationEditorUpdateClipArgs {
  input: EditorUpdateClipInput;
}


export interface MutationRemoveClipArgs {
  input: RemoveClipInput;
}


export interface MutationRemoveClipBookmarkArgs {
  input: RemoveBookmarkInput;
}


export interface MutationRemoveClipDislikeArgs {
  input: RemoveClipDislikeInput;
}


export interface MutationRemoveClipLikeArgs {
  input: RemoveClipLikeInput;
}


export interface MutationRemoveCommentArgs {
  input: RemoveCommentInput;
}


export interface MutationUpdateClipArgs {
  input: UpdateClipInput;
}


export interface MutationUpdateCommentArgs {
  input: UpdateCommentInput;
}

export interface Query {
  /** Get user bookmarked clips */
  bookmarkedClips: Clips;
  /** Get channel clips */
  channelClips: Clips;
  /** Get clip page number */
  clipPage: ClipPage;
  /** Get comment replies */
  commentReplies: Comments;
  /** Get abused clips */
  editorAbusedClips: Clips;
  /** Get entity comments */
  entityComments: Comments;
  /** Find clip by id */
  findClipById: Clip;
  /** Get followings clips */
  followingsClips: Clips;
  /** Get channel liked clips */
  likedClips: Clips;
  /** Search channels */
  searchChannels: ClipsChannels;
  /** Search clips */
  searchClips: Clips;
  /** Search tags */
  searchTags: Tags;
  /** Get tag clips */
  tagClips: Clips;
}


export interface QueryBookmarkedClipsArgs {
  order?: InputMaybe<ClipsOrder>;
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryChannelClipsArgs {
  channelId: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryClipPageArgs {
  clipId: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
}


export interface QueryCommentRepliesArgs {
  page: Scalars['Int']['input'];
  parentCommentId: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryEditorAbusedClipsArgs {
  filters?: InputMaybe<AbusedClipsFilters>;
  order?: InputMaybe<AbusedClipsOrder>;
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryEntityCommentsArgs {
  entityId: Scalars['Int']['input'];
  entityType: Entity;
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryFindClipByIdArgs {
  clipId: Scalars['Int']['input'];
}


export interface QueryFollowingsClipsArgs {
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryLikedClipsArgs {
  order?: InputMaybe<ClipsOrder>;
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
}


export interface QuerySearchChannelsArgs {
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
}


export interface QuerySearchClipsArgs {
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
}


export interface QuerySearchTagsArgs {
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
}


export interface QueryTagClipsArgs {
  page: Scalars['Int']['input'];
  perPage?: InputMaybe<Scalars['Int']['input']>;
  tagTitle: Scalars['String']['input'];
}

/** Autogenerated input type of RemoveBookmark */
export interface RemoveBookmarkInput {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  clipId: Scalars['Int']['input'];
}

/** Autogenerated input type of RemoveClipDislike */
export interface RemoveClipDislikeInput {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  clipId: Scalars['Int']['input'];
}

/** Autogenerated input type of RemoveClip */
export interface RemoveClipInput {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  clipId: Scalars['Int']['input'];
}

/** Autogenerated input type of RemoveClipLike */
export interface RemoveClipLikeInput {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  clipId: Scalars['Int']['input'];
}

/** Autogenerated return type of RemoveClip. */
export interface RemoveClipPayload {
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
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

export interface Tags {
  meta: Meta;
  tags: Array<Scalars['String']['output']>;
}

/** Autogenerated input type of UpdateClip */
export interface UpdateClipInput {
  ageRestricted?: InputMaybe<Scalars['Boolean']['input']>;
  /** A unique identifier for the client performing the mutation. */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  clipId: Scalars['Int']['input'];
  commentsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
  uploadState?: InputMaybe<ClipUploadState>;
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
      totalPages?: number | null
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
      totalPages?: number | null
    }
  }
};
