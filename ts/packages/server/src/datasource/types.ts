export const DataSourceErrorCode = {
  Unspecified: 0,
  Unavailable: 1,
  Unauthenticated: 2,
  PermissionDenied: 3,
  SourceNotFound: 4,
  QueryInvalid: 5,
  QueryFailed: 6,
  LimitExceeded: 7,
  Timeout: 8,
  UpstreamAuthFailed: 9,
  Internal: 10,
  TableNotFound: 11,
  ColumnNotFound: 12,
  Cancelled: 13,
  ResourceExhausted: 14,
  InvalidArgument: 15,
  ExternalError: 16,
} as const;

export type DataSourceErrorCode = (typeof DataSourceErrorCode)[keyof typeof DataSourceErrorCode];

export interface SessionContext {
  account?: string;
  channelId?: string;
  kernelToken?: string;
  teamMemberId?: string;
  datasourceToken?: string;
}

export interface ListTablesRequest {
  session?: SessionContext;
  sourceId?: string;
  tableNameFilterPattern?: string;
}

export interface Table {
  name?: string;
  description?: string;
  estimatedRowCount?: number;
  updatedAt?: number;
  tableType?: number;
}

export interface ListTablesResponse {
  tables?: Table[];
}

export interface DescribeTableRequest {
  session?: SessionContext;
  sourceId?: string;
  table?: string;
}

export interface Column {
  name?: string;
  type?: string;
  nullable?: boolean;
  description?: string;
  partitionKey?: boolean;
  precision?: number;
  scale?: number;
}

export interface TableDefinition {
  table?: Table;
  columns?: Column[];
  primaryKey?: string[];
}

export interface SearchTablesRequest {
  session?: SessionContext;
  sourceId?: string;
  queries?: string[];
  limit?: number;
}

export interface SearchTablesResponse {
  tables?: Table[];
}

export interface ExecuteQueryRequest {
  session?: SessionContext;
  sourceId?: string;
  query?: string;
  rowLimit?: number;
  byteLimit?: number;
  timeoutMs?: number;
}

export interface ArrowIpcMessage {
  dataHeader?: Uint8Array;
  dataBody?: Uint8Array;
}

export interface QueryResult {
  rowCount?: number;
  limitExceeded?: boolean;
  executionMs?: number;
}

export interface UpstreamError {
  engine?: string;
  code?: string;
  message?: string;
}

export interface DataSourceError {
  code?: DataSourceErrorCode;
  message?: string;
  retryable?: boolean;
  upstream?: UpstreamError;
}

export interface DataSourceExecutionErrorOptions {
  code: DataSourceErrorCode;
  message: string;
  retryable?: boolean;
  upstream?: UpstreamError;
  cause?: unknown;
}

export class DataSourceExecutionError extends Error {
  readonly code: DataSourceErrorCode;
  readonly retryable: boolean;
  readonly upstream?: UpstreamError;

  constructor(options: DataSourceExecutionErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "DataSourceExecutionError";
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    if (options.upstream !== undefined) {
      this.upstream = options.upstream;
    }
  }
}

export interface QueryChunk {
  arrow?: ArrowIpcMessage;
  result?: QueryResult;
  error?: DataSourceError;
}

export interface QueryChunkSink {
  send(chunk: QueryChunk): void;
}

export const DataSourceRouteMetadataKey = "x-datasource-route";
export const DataSourceAccessTokenMetadataKey = "x-access-token";
export const DataSourceSignatureMetadataKey = "x-signature";

export const DataSourceAppIdentityMetadataKeys = {
  AppSlug: "x-app-slug",
  ChannelAppSlug: "x-channel-app-slug",
  AppId: "x-app-id",
  ChannelAppId: "x-channel-app-id",
} as const;

export type DataSourceMetadataValue = string | Uint8Array;

export interface DataSourceAppIdentity {
  appSlug?: string;
  appId?: string;
  appSlugOrId?: string;
}

export interface DataSourceAccessTokenIdentity {
  accessToken: string;
  appId?: string;
  channelId?: string;
  managerId?: string;
  callerType?: string;
  callerID?: string;
  scopes: Record<string, string[]>;
}

export type DataSourceAccessTokenValidator = (
  accessToken: string
) => DataSourceAccessTokenIdentity | Promise<DataSourceAccessTokenIdentity>;

export type DataSourceSigningKeyResolver = (
  identity: DataSourceAccessTokenIdentity
) => string | Promise<string>;

export interface ExecuteQueryContext {
  metadata: Record<string, DataSourceMetadataValue[]>;
  route?: string;
  appIdentity: DataSourceAppIdentity;
  accessToken?: string;
  accessTokenIdentity?: DataSourceAccessTokenIdentity;
  getMetadataValues(name: string): DataSourceMetadataValue[];
  getMetadataTextValues(name: string): string[];
  getMetadataText(name: string): string | undefined;
}

export type ExecuteQueryHandler = (
  request: ExecuteQueryRequest,
  sink: QueryChunkSink,
  context?: ExecuteQueryContext
) => void | Promise<void>;

export interface DataSourceQueryExecutor {
  executeQuery(
    request: ExecuteQueryRequest,
    sink: QueryChunkSink,
    context?: ExecuteQueryContext
  ): Promise<void>;
  close?(): Promise<void>;
}

export interface RoutedExecuteQueryHandlerOptions {
  defaultHandler?: ExecuteQueryHandler;
}

export interface DataSourceServiceHandlers {
  listTables?: (request: ListTablesRequest) => ListTablesResponse | Promise<ListTablesResponse>;
  describeTable?: (request: DescribeTableRequest) => TableDefinition | Promise<TableDefinition>;
  searchTables?: (
    request: SearchTablesRequest
  ) => SearchTablesResponse | Promise<SearchTablesResponse>;
  executeQuery: ExecuteQueryHandler;
}

export interface DataSourceGrpcOptions {
  allowedSources?: string[];
  signingKey?: string;
  signingKeyResolver?: DataSourceSigningKeyResolver;
  accessTokenValidator?: DataSourceAccessTokenValidator;
  requireAccessToken?: boolean;
}
