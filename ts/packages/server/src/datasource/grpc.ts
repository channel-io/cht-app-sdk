import * as grpc from "@grpc/grpc-js";
import protobuf from "protobufjs";
import { parseJWTAccessTokenUnverified, verifyDataSourceSignature } from "./auth.js";
import {
  DataSourceAccessTokenMetadataKey,
  DataSourceAppIdentityMetadataKeys,
  DataSourceRouteMetadataKey,
  DataSourceSignatureMetadataKey,
  DataSourceExecutionError,
  DataSourceErrorCode,
  type DataSourceError,
  type DataSourceAccessTokenIdentity,
  type DataSourceGrpcOptions,
  type DataSourceMetadataValue,
  type DataSourceServiceHandlers,
  type ExecuteQueryContext,
  type ExecuteQueryRequest,
  type QueryChunk,
  type QueryChunkSink,
} from "./types.js";

const datasourceProto = `
syntax = "proto3";
package io.channel.datasource.v1;

service DataSourceService {
  rpc ListTables(ListTablesRequest) returns (ListTablesResponse);
  rpc DescribeTable(DescribeTableRequest) returns (TableDefinition);
  rpc SearchTables(SearchTablesRequest) returns (SearchTablesResponse);
  rpc ExecuteQuery(ExecuteQueryRequest) returns (stream QueryChunk);
}

message SessionContext {
  string account = 1;
  string channel_id = 2;
  optional string kernel_token = 3;
  string team_member_id = 4;
  optional string datasource_token = 5;
}

message Table {
  string name = 1;
  string description = 2;
  int64 estimated_row_count = 3;
  int64 updated_at = 4;
  int32 table_type = 5;
}

message Column {
  string name = 1;
  string type = 2;
  bool nullable = 3;
  string description = 4;
  bool partition_key = 5;
  int32 precision = 6;
  int32 scale = 7;
}

message TableDefinition {
  Table table = 1;
  repeated Column columns = 2;
  repeated string primary_key = 3;
}

message ListTablesRequest {
  SessionContext session = 1;
  string source_id = 2;
  optional string table_name_filter_pattern = 3;
}

message ListTablesResponse {
  repeated Table tables = 1;
}

message DescribeTableRequest {
  SessionContext session = 1;
  string source_id = 2;
  string table = 3;
}

message SearchTablesRequest {
  SessionContext session = 1;
  string source_id = 2;
  repeated string queries = 3;
  int32 limit = 4;
}

message SearchTablesResponse {
  repeated Table tables = 1;
}

message ExecuteQueryRequest {
  SessionContext session = 1;
  string source_id = 2;
  string query = 3;
  int64 row_limit = 4;
  int64 byte_limit = 5;
  int64 timeout_ms = 6;
}

message ArrowIpcMessage {
  bytes data_header = 1;
  bytes data_body = 2;
}

message QueryChunk {
  oneof payload {
    ArrowIpcMessage arrow = 1;
    QueryResult result = 2;
    DataSourceError error = 3;
  }
}

message QueryResult {
  int64 row_count = 1;
  bool limit_exceeded = 2;
  int64 execution_ms = 3;
}

message DataSourceError {
  int32 code = 1;
  string message = 2;
  bool retryable = 3;
  UpstreamError upstream = 4;
}

message UpstreamError {
  string engine = 1;
  string code = 2;
  string message = 3;
}
`;

const root = protobuf.parse(datasourceProto).root;
const serviceName = "io.channel.datasource.v1.DataSourceService";
const servicePath = "/io.channel.datasource.v1.DataSourceService";

const messageTypes = {
  ListTablesRequest: root.lookupType("io.channel.datasource.v1.ListTablesRequest"),
  ListTablesResponse: root.lookupType("io.channel.datasource.v1.ListTablesResponse"),
  DescribeTableRequest: root.lookupType("io.channel.datasource.v1.DescribeTableRequest"),
  TableDefinition: root.lookupType("io.channel.datasource.v1.TableDefinition"),
  SearchTablesRequest: root.lookupType("io.channel.datasource.v1.SearchTablesRequest"),
  SearchTablesResponse: root.lookupType("io.channel.datasource.v1.SearchTablesResponse"),
  ExecuteQueryRequest: root.lookupType("io.channel.datasource.v1.ExecuteQueryRequest"),
  QueryChunk: root.lookupType("io.channel.datasource.v1.QueryChunk"),
};

export const DataSourceServiceDefinition = {
  ListTables: unaryMethod(
    "ListTables",
    messageTypes.ListTablesRequest,
    messageTypes.ListTablesResponse
  ),
  DescribeTable: unaryMethod(
    "DescribeTable",
    messageTypes.DescribeTableRequest,
    messageTypes.TableDefinition
  ),
  SearchTables: unaryMethod(
    "SearchTables",
    messageTypes.SearchTablesRequest,
    messageTypes.SearchTablesResponse
  ),
  ExecuteQuery: {
    path: `${servicePath}/ExecuteQuery`,
    requestStream: false,
    responseStream: true,
    requestSerialize: serializer(messageTypes.ExecuteQueryRequest),
    requestDeserialize: deserializer<ExecuteQueryRequest>(messageTypes.ExecuteQueryRequest),
    responseSerialize: serializer(messageTypes.QueryChunk),
    responseDeserialize: deserializer<QueryChunk>(messageTypes.QueryChunk),
    originalName: "executeQuery",
  },
} satisfies grpc.ServiceDefinition;

export function createDataSourceGrpcServer(
  handlers: DataSourceServiceHandlers,
  options: DataSourceGrpcOptions = {}
): grpc.Server {
  const server = new grpc.Server();
  addDataSourceService(server, handlers, options);
  return server;
}

export function addDataSourceService(
  server: grpc.Server,
  handlers: DataSourceServiceHandlers,
  options: DataSourceGrpcOptions = {}
): void {
  const allowedSources = new Set(options.allowedSources ?? []);
  server.addService(DataSourceServiceDefinition, {
    ListTables: unaryHandler(handlers.listTables),
    DescribeTable: unaryHandler(handlers.describeTable),
    SearchTables: unaryHandler(handlers.searchTables),
    ExecuteQuery: (call: grpc.ServerWritableStream<ExecuteQueryRequest, QueryChunk>) => {
      void handleExecuteQuery(call, handlers, allowedSources, options);
    },
  });
}

export function serializeExecuteQueryRequestForSignature(request: ExecuteQueryRequest): Uint8Array {
  return serializeMessage(messageTypes.ExecuteQueryRequest, request);
}

async function handleExecuteQuery(
  call: grpc.ServerWritableStream<ExecuteQueryRequest, QueryChunk>,
  handlers: DataSourceServiceHandlers,
  allowedSources: Set<string>,
  options: DataSourceGrpcOptions
): Promise<void> {
  const validationError = validateExecuteQueryRequest(call.request, allowedSources);
  if (validationError) {
    writeTerminalError(
      call,
      errorChunk(validationError.code, validationError.message),
      validationError.status,
      validationError.message
    );
    return;
  }

  const context = createExecuteQueryContext(call.metadata);
  const authResult = await authenticateExecuteQuery(call.request, context, options);
  if (authResult.error) {
    writeTerminalError(
      call,
      errorChunk(DataSourceErrorCode.Unauthenticated, authResult.error.message),
      grpc.status.UNAUTHENTICATED,
      authResult.error.message
    );
    return;
  }

  const sink: QueryChunkSink = {
    send: (chunk) => call.write(chunk),
  };
  try {
    await handlers.executeQuery(call.request, sink, authResult.context);
    call.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeTerminalError(call, toErrorChunk(error), grpc.status.UNKNOWN, message);
  }
}

interface ExecuteQueryAuthResult {
  context: ExecuteQueryContext;
  error?: Error;
}

async function authenticateExecuteQuery(
  request: ExecuteQueryRequest,
  context: ExecuteQueryContext,
  options: DataSourceGrpcOptions
): Promise<ExecuteQueryAuthResult> {
  const signingKey = options.signingKey?.trim();
  const shouldAuthenticate =
    Boolean(signingKey) ||
    Boolean(options.signingKeyResolver) ||
    Boolean(options.accessTokenValidator) ||
    options.requireAccessToken === true;
  if (!shouldAuthenticate) {
    return { context };
  }

  const accessToken = context.accessToken?.trim();
  if (!accessToken) {
    return { context, error: new Error("missing datasource access token") };
  }
  let identity: DataSourceAccessTokenIdentity | undefined;
  try {
    if (signingKey || options.signingKeyResolver || !options.accessTokenValidator) {
      identity = parseJWTAccessTokenUnverified(accessToken);
    }
  } catch {
    return { context, error: new Error("invalid datasource access token") };
  }

  const resolvedSigningKey = options.signingKeyResolver
    ? (await options.signingKeyResolver(identity!)).trim()
    : signingKey;
  if (resolvedSigningKey) {
    const signature = context.getMetadataText(DataSourceSignatureMetadataKey);
    if (!signature) {
      return { context, error: new Error("missing datasource signature") };
    }
    if (
      !verifyDataSourceSignature(
        signature,
        resolvedSigningKey,
        serializeMessage(messageTypes.ExecuteQueryRequest, request),
        accessToken
      )
    ) {
      return { context, error: new Error("invalid datasource signature") };
    }
  }

  try {
    identity = options.accessTokenValidator
      ? await options.accessTokenValidator(accessToken)
      : identity;
  } catch {
    return { context, error: new Error("invalid datasource access token") };
  }
  if (!identity) {
    return { context, error: new Error("invalid datasource access token") };
  }
  return {
    context: {
      ...context,
      accessTokenIdentity: identity,
    },
  };
}

export function createExecuteQueryContext(
  metadata: grpc.Metadata,
  accessTokenIdentity?: DataSourceAccessTokenIdentity
): ExecuteQueryContext {
  const normalized = normalizeMetadata(metadata);
  const getMetadataValues = (name: string): DataSourceMetadataValue[] =>
    normalized[normalizeMetadataKey(name)] ?? [];
  const getMetadataTextValues = (name: string): string[] =>
    getMetadataValues(name)
      .map(metadataValueToText)
      .filter((value): value is string => value !== undefined && value.length > 0);
  const getMetadataText = (name: string): string | undefined => getMetadataTextValues(name)[0];
  const accessTokenMetadata = getMetadataText(DataSourceAccessTokenMetadataKey)?.trim();
  const accessToken = accessTokenMetadata === "" ? undefined : accessTokenMetadata;
  const routeMetadata = getMetadataText(DataSourceRouteMetadataKey)?.trim();
  const route = routeMetadata === "" ? undefined : routeMetadata;
  const appSlug =
    getMetadataText(DataSourceAppIdentityMetadataKeys.AppSlug) ??
    getMetadataText(DataSourceAppIdentityMetadataKeys.ChannelAppSlug);
  const appId =
    getMetadataText(DataSourceAppIdentityMetadataKeys.AppId) ??
    getMetadataText(DataSourceAppIdentityMetadataKeys.ChannelAppId);
  const appIdentity = {};
  if (appSlug) {
    Object.assign(appIdentity, { appSlug });
  }
  if (appId) {
    Object.assign(appIdentity, { appId });
  }
  const appSlugOrId = appSlug ?? appId;
  if (appSlugOrId) {
    Object.assign(appIdentity, { appSlugOrId });
  }

  return {
    metadata: normalized,
    ...(route ? { route } : {}),
    ...(accessToken ? { accessToken } : {}),
    ...(accessTokenIdentity ? { accessTokenIdentity } : {}),
    appIdentity,
    getMetadataValues,
    getMetadataTextValues,
    getMetadataText,
  };
}

export function arrowChunk(dataBody: Uint8Array, dataHeader?: Uint8Array): QueryChunk {
  return {
    arrow: {
      ...(dataHeader ? { dataHeader } : {}),
      dataBody,
    },
  };
}

export function errorChunk(
  code: DataSourceErrorCode,
  message: string,
  options: { retryable?: boolean; upstream?: DataSourceError["upstream"] } = {}
): QueryChunk {
  return {
    error: {
      code,
      message,
      retryable: options.retryable ?? false,
      ...(options.upstream ? { upstream: options.upstream } : {}),
    },
  };
}

export function toErrorChunk(error: unknown): QueryChunk {
  if (error instanceof DataSourceExecutionError) {
    return errorChunk(error.code, error.message, {
      retryable: error.retryable,
      upstream: error.upstream,
    });
  }
  const message = error instanceof Error ? error.message : String(error);
  return errorChunk(DataSourceErrorCode.ExternalError, message);
}

function unaryMethod(
  name: string,
  requestType: protobuf.Type,
  responseType: protobuf.Type
): grpc.MethodDefinition<unknown, unknown> {
  return {
    path: `${servicePath}/${name}`,
    requestStream: false,
    responseStream: false,
    requestSerialize: serializer(requestType),
    requestDeserialize: deserializer(requestType),
    responseSerialize: serializer(responseType),
    responseDeserialize: deserializer(responseType),
    originalName: name.charAt(0).toLowerCase() + name.slice(1),
  };
}

function unaryHandler<TReq, TRes>(
  handler: ((request: TReq) => TRes | Promise<TRes>) | undefined
): grpc.handleUnaryCall<TReq, TRes> {
  return (call, callback) => {
    void (async () => {
      if (!handler) {
        callback({ code: grpc.status.UNIMPLEMENTED, message: "method is not implemented" });
        return;
      }
      try {
        callback(null, await handler(call.request));
      } catch (error) {
        callback({
          code: grpc.status.INTERNAL,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    })();
  };
}

function serializer(type: protobuf.Type): grpc.serialize<unknown> {
  return (value) => Buffer.from(serializeMessage(type, value));
}

function serializeMessage(type: protobuf.Type, value: unknown): Uint8Array {
  return type.encode(type.fromObject(value as Record<string, unknown>)).finish();
}

function deserializer<T>(type: protobuf.Type): grpc.deserialize<T> {
  return (buffer) =>
    type.toObject(type.decode(buffer), {
      longs: Number,
      enums: Number,
      bytes: Uint8Array,
      defaults: false,
      arrays: true,
      objects: true,
    }) as T;
}

function normalizeMetadata(metadata: grpc.Metadata): Record<string, DataSourceMetadataValue[]> {
  const normalized: Record<string, DataSourceMetadataValue[]> = {};
  for (const key of Object.keys(metadata.getMap())) {
    normalized[normalizeMetadataKey(key)] = metadata.get(key);
  }
  return normalized;
}

function normalizeMetadataKey(name: string): string {
  return name.toLowerCase();
}

function metadataValueToText(value: DataSourceMetadataValue): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  return Buffer.from(value).toString("utf8");
}

function validateExecuteQueryRequest(
  request: ExecuteQueryRequest,
  allowedSources: Set<string>
): { code: DataSourceErrorCode; status: grpc.status; message: string } | undefined {
  if (!request.session) {
    return {
      code: DataSourceErrorCode.InvalidArgument,
      status: grpc.status.INVALID_ARGUMENT,
      message: "session is required",
    };
  }
  if (!request.sourceId) {
    return {
      code: DataSourceErrorCode.InvalidArgument,
      status: grpc.status.INVALID_ARGUMENT,
      message: "source_id is required",
    };
  }
  if (allowedSources.size > 0 && !allowedSources.has(request.sourceId)) {
    return {
      code: DataSourceErrorCode.SourceNotFound,
      status: grpc.status.NOT_FOUND,
      message: "source_id is not registered",
    };
  }
  if (!request.query?.trim()) {
    return {
      code: DataSourceErrorCode.InvalidArgument,
      status: grpc.status.INVALID_ARGUMENT,
      message: "query is required",
    };
  }
  return undefined;
}

function writeTerminalError(
  call: grpc.ServerWritableStream<ExecuteQueryRequest, QueryChunk>,
  chunk: QueryChunk,
  code: grpc.status,
  message: string
): void {
  call.write(chunk, () => {
    call.emit("error", grpcStatus(code, message));
  });
}

function grpcStatus(code: grpc.status, message: string): grpc.ServerErrorResponse {
  const error = new Error(message) as grpc.ServerErrorResponse;
  error.code = code;
  error.details = message;
  return error;
}

export { serviceName as DataSourceGrpcServiceName };
