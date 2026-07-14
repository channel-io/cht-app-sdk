import { writeArrowIpcStream } from "./arrow.js";
import { DataSourceByteLimitTracker, queryWithRowLimit, validateReadOnlyQuery } from "./policy.js";
import type { DataSourceTableConfig } from "./policy.js";
import {
  DataSourceErrorCode,
  DataSourceExecutionError,
  type DataSourceQueryExecutor,
  type ExecuteQueryRequest,
  type QueryChunkSink,
} from "./types.js";

export interface BigQueryDataSourceConfig {
  projectId: string;
  credentialsJson?: string;
  credentialsJsonEnv?: string;
  credentialsEnvVars?: readonly string[];
  keyFilename?: string;
  clientOptions?: Record<string, unknown>;
  bigQueryClient?: BigQueryClientLike;
  readClient?: BigQueryReadClientLike;
  sources: readonly BigQueryDataSourceSourceConfig[];
}

export interface BigQueryDataSourceSourceConfig {
  sourceId: string;
  projectId?: string;
  datasetId: string;
  location?: string;
  tables?: readonly DataSourceTableConfig[];
  maxStreamCount?: number;
  maximumBytesBilled?: string | number | bigint;
}

interface NormalizedBigQuerySourceConfig extends BigQueryDataSourceSourceConfig {
  sourceId: string;
  projectId: string;
  maxStreamCount: number;
}

export function createBigQueryDataSourceExecutor(
  config: BigQueryDataSourceConfig
): BigQueryDataSourceExecutor {
  return new BigQueryDataSourceExecutor(config);
}

export class BigQueryDataSourceExecutor implements DataSourceQueryExecutor {
  private readonly sources = new Map<string, NormalizedBigQuerySourceConfig>();
  private bigQueryClient?: BigQueryClientLike;
  private readClient?: BigQueryReadClientLike;

  constructor(private readonly config: BigQueryDataSourceConfig) {
    const projectId = config.projectId.trim();
    if (!projectId) {
      throw new Error("BigQuery project_id is required");
    }
    if (config.sources.length === 0) {
      throw new Error("at least one BigQuery datasource source is required");
    }
    for (const source of config.sources) {
      const normalized = normalizeSource(source, projectId);
      if (this.sources.has(normalized.sourceId)) {
        throw new Error(`duplicate datasource source_id: ${normalized.sourceId}`);
      }
      this.sources.set(normalized.sourceId, normalized);
    }
  }

  async executeQuery(request: ExecuteQueryRequest, sink: QueryChunkSink): Promise<void> {
    const req = normalizeRequest(request);
    const source = this.sources.get(req.sourceId);
    if (!source) {
      throw new DataSourceExecutionError({
        code: DataSourceErrorCode.SourceNotFound,
        message: `unknown datasource source_id: ${req.sourceId}`,
      });
    }
    validateReadOnlyQuery(req.query, [], source.tables ?? []);

    const startedAt = Date.now();
    const clients = await this.ensureClients();
    const byteLimit = new DataSourceByteLimitTracker(req.byteLimit);
    try {
      const destination = await runQueryJob(clients.bigQueryClient, source, req);
      const rowCount = await streamBigQueryResult(
        clients.readClient,
        source,
        destination,
        sink,
        byteLimit
      );
      sink.send({
        result: { rowCount, limitExceeded: false, executionMs: Date.now() - startedAt },
      });
    } catch (error) {
      throw toBigQueryDataSourceError(error);
    }
  }

  async close(): Promise<void> {
    if (!this.config.readClient && this.readClient?.close) {
      await this.readClient.close();
    }
  }

  private async ensureClients(): Promise<{
    bigQueryClient: BigQueryClientLike;
    readClient: BigQueryReadClientLike;
  }> {
    if (this.bigQueryClient && this.readClient) {
      return { bigQueryClient: this.bigQueryClient, readClient: this.readClient };
    }
    const options = clientOptions(this.config);
    this.bigQueryClient = this.config.bigQueryClient ?? (await createBigQueryClient(options));
    this.readClient = this.config.readClient ?? (await createBigQueryReadClient(options));
    return { bigQueryClient: this.bigQueryClient, readClient: this.readClient };
  }
}

async function runQueryJob(
  client: BigQueryClientLike,
  source: NormalizedBigQuerySourceConfig,
  req: NormalizedQueryRequest
): Promise<BigQueryTableRef> {
  const options: BigQueryQueryJobOptions = {
    query: queryWithRowLimit(req.query, req.rowLimit),
    useLegacySql: false,
    defaultDataset: {
      projectId: source.projectId,
      datasetId: source.datasetId,
    },
    labels: { component: "datasource" },
  };
  if (source.location) {
    options.location = source.location;
  }
  if (req.timeoutMs && req.timeoutMs > 0) {
    options.jobTimeoutMs = Math.trunc(req.timeoutMs);
  }
  if (source.maximumBytesBilled !== undefined) {
    options.maximumBytesBilled = String(source.maximumBytesBilled);
  }

  const [job] = await client.createQueryJob(options);
  const queryResultsOptions: Record<string, unknown> = {
    autoPaginate: false,
    maxResults: 0,
  };
  if (source.location) {
    queryResultsOptions["location"] = source.location;
  }
  await job.getQueryResults(queryResultsOptions);

  const [metadata] = await job.getMetadata();
  const table = metadata.configuration?.query?.destinationTable;
  if (!table?.projectId || !table.datasetId || !table.tableId) {
    throw new Error("BigQuery query job destination table is missing");
  }
  return {
    projectId: table.projectId,
    datasetId: table.datasetId,
    tableId: table.tableId,
  };
}

async function streamBigQueryResult(
  client: BigQueryReadClientLike,
  source: NormalizedBigQuerySourceConfig,
  table: BigQueryTableRef,
  sink: QueryChunkSink,
  byteLimit: DataSourceByteLimitTracker
): Promise<number> {
  const [session] = await client.createReadSession({
    parent: `projects/${source.projectId}`,
    readSession: {
      table: `projects/${table.projectId}/datasets/${table.datasetId}/tables/${table.tableId}`,
      dataFormat: "ARROW",
    },
    maxStreamCount: source.maxStreamCount,
  });

  let schemaSent = false;
  const sessionSchema = bytesFromUnknown(session.arrowSchema?.serializedSchema);
  if (sessionSchema) {
    writeArrowIpcStream(sink, sessionSchema, { byteLimit });
    schemaSent = true;
  }

  let rowCount = 0;
  for (const stream of session.streams ?? []) {
    if (!stream.name) {
      continue;
    }
    const rows = client.readRows({ readStream: stream.name });
    for await (const response of rows) {
      const responseSchema = bytesFromUnknown(response.arrowSchema?.serializedSchema);
      if (responseSchema && !schemaSent) {
        writeArrowIpcStream(sink, responseSchema, { byteLimit });
        schemaSent = true;
      }
      const batch = bytesFromUnknown(response.arrowRecordBatch?.serializedRecordBatch);
      if (batch) {
        writeArrowIpcStream(sink, batch, { byteLimit });
      }
      rowCount += numberFromLong(response.rowCount);
    }
  }
  return rowCount;
}

function normalizeSource(
  source: BigQueryDataSourceSourceConfig,
  defaultProjectId: string
): NormalizedBigQuerySourceConfig {
  const sourceId = source.sourceId.trim();
  if (!sourceId) {
    throw new Error("source_id is required");
  }
  if (!source.datasetId.trim()) {
    throw new Error(`BigQuery dataset_id is required for source_id ${sourceId}`);
  }
  return {
    ...source,
    sourceId,
    projectId: normalizedProjectId(source.projectId, defaultProjectId),
    maxStreamCount:
      source.maxStreamCount && source.maxStreamCount > 0 ? Math.trunc(source.maxStreamCount) : 1,
  };
}

function normalizedProjectId(projectId: string | undefined, defaultProjectId: string): string {
  const trimmed = projectId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : defaultProjectId;
}

interface NormalizedQueryRequest {
  sourceId: string;
  query: string;
  rowLimit: number | undefined;
  byteLimit: number | undefined;
  timeoutMs: number | undefined;
}

function normalizeRequest(request: ExecuteQueryRequest): NormalizedQueryRequest {
  return {
    sourceId: request.sourceId?.trim() ?? "",
    query: request.query?.trim() ?? "",
    rowLimit: request.rowLimit,
    byteLimit: request.byteLimit,
    timeoutMs: request.timeoutMs,
  };
}

function clientOptions(config: BigQueryDataSourceConfig): Record<string, unknown> {
  const options: Record<string, unknown> = {
    ...config.clientOptions,
    projectId: config.projectId,
  };
  if (config.keyFilename) {
    options["keyFilename"] = config.keyFilename;
  }

  const credentialsJson = credentialJson(config);
  if (credentialsJson) {
    options["credentials"] = JSON.parse(credentialsJson) as Record<string, unknown>;
  }
  return options;
}

function credentialJson(config: BigQueryDataSourceConfig): string | undefined {
  if (config.credentialsJson?.trim()) {
    return config.credentialsJson;
  }
  if (config.credentialsJsonEnv?.trim()) {
    const value = process.env[config.credentialsJsonEnv];
    if (value?.trim()) {
      return value;
    }
  }
  for (const envName of config.credentialsEnvVars ?? []) {
    const value = process.env[envName];
    if (value?.trim()) {
      return value;
    }
  }
  return undefined;
}

async function createBigQueryClient(options: Record<string, unknown>): Promise<BigQueryClientLike> {
  try {
    const mod = (await importOptionalModule("@google-cloud/bigquery")) as {
      BigQuery: new (options: Record<string, unknown>) => BigQueryClientLike;
    };
    return new mod.BigQuery(options);
  } catch (error) {
    throw new DataSourceExecutionError({
      code: DataSourceErrorCode.Unavailable,
      message: `@google-cloud/bigquery is required for BigQuery datasource execution: ${errorMessage(
        error
      )}`,
      cause: error,
    });
  }
}

async function createBigQueryReadClient(
  options: Record<string, unknown>
): Promise<BigQueryReadClientLike> {
  try {
    const mod = (await importOptionalModule("@google-cloud/bigquery-storage")) as {
      BigQueryReadClient: new (options: Record<string, unknown>) => BigQueryReadClientLike;
    };
    return new mod.BigQueryReadClient(options);
  } catch (error) {
    throw new DataSourceExecutionError({
      code: DataSourceErrorCode.Unavailable,
      message: `@google-cloud/bigquery-storage is required for BigQuery Storage streaming: ${errorMessage(
        error
      )}`,
      cause: error,
    });
  }
}

function bytesFromUnknown(value: unknown): Uint8Array | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (value instanceof Uint8Array) {
    return value;
  }
  if (typeof value === "string") {
    return Buffer.from(value, "base64");
  }
  return undefined;
}

function numberFromLong(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object" && "toString" in value) {
    const objectValue = value as { toString: () => string };
    if (objectValue.toString === Object.prototype.toString) {
      return 0;
    }
    const parsed = Number(objectValue.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toBigQueryDataSourceError(error: unknown): unknown {
  if (error instanceof DataSourceExecutionError) {
    return error;
  }
  if (error instanceof Error) {
    const upstream: { engine: string; message: string; code?: string } = {
      engine: "bigquery",
      message: error.message,
    };
    const code = errorCode(error);
    if (code) {
      upstream.code = code;
    }
    return new DataSourceExecutionError({
      code: DataSourceErrorCode.ExternalError,
      message: "BigQuery datasource query failed",
      upstream,
      cause: error,
    });
  }
  return error;
}

function errorCode(error: Error): string | undefined {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function importOptionalModule(specifier: string): Promise<unknown> {
  const mod: unknown = await import(specifier);
  return mod;
}

export interface BigQueryClientLike {
  createQueryJob(options: BigQueryQueryJobOptions): Promise<[BigQueryJobLike]>;
}

export interface BigQueryJobLike {
  getQueryResults(options: Record<string, unknown>): Promise<unknown>;
  getMetadata(): Promise<[BigQueryJobMetadata]>;
}

export interface BigQueryReadClientLike {
  createReadSession(request: BigQueryCreateReadSessionRequest): Promise<[BigQueryReadSession]>;
  readRows(request: { readStream: string }): AsyncIterable<BigQueryReadRowsResponse>;
  close?(): Promise<void>;
}

export interface BigQueryQueryJobOptions {
  query: string;
  useLegacySql: boolean;
  defaultDataset: {
    projectId: string;
    datasetId: string;
  };
  location?: string;
  jobTimeoutMs?: number;
  maximumBytesBilled?: string;
  labels?: Record<string, string>;
}

export interface BigQueryJobMetadata {
  configuration?: {
    query?: {
      destinationTable?: Partial<BigQueryTableRef>;
    };
  };
}

export interface BigQueryTableRef {
  projectId: string;
  datasetId: string;
  tableId: string;
}

export interface BigQueryCreateReadSessionRequest {
  parent: string;
  readSession: {
    table: string;
    dataFormat: "ARROW";
  };
  maxStreamCount: number;
}

export interface BigQueryReadSession {
  arrowSchema?: {
    serializedSchema?: unknown;
  } | null;
  streams?:
    | {
        name?: string | null;
      }[]
    | null;
}

export interface BigQueryReadRowsResponse {
  arrowSchema?: {
    serializedSchema?: unknown;
  } | null;
  arrowRecordBatch?: {
    serializedRecordBatch?: unknown;
  } | null;
  rowCount?: unknown;
}
