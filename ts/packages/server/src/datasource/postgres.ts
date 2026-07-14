import { writeRowsAsArrowIpcBatch, type ArrowField } from "./arrow.js";
import { DataSourceByteLimitTracker, queryWithRowLimit, validateReadOnlyQuery } from "./policy.js";
import type { DataSourceTableConfig } from "./policy.js";
import {
  DataSourceErrorCode,
  DataSourceExecutionError,
  type DataSourceQueryExecutor,
  type ExecuteQueryRequest,
  type QueryChunkSink,
} from "./types.js";

const defaultBatchSize = 1024;

export interface PostgresPoolLike {
  connect(): Promise<PostgresClientLike>;
  end?(): Promise<void>;
}

export interface PostgresClientLike {
  query(query: unknown, values?: unknown[]): unknown;
  release(error?: unknown): void;
}

export interface PostgresDataSourceConfig {
  sources: readonly PostgresDataSourceSourceConfig[];
  defaultBatchSize?: number;
}

export interface PostgresDataSourceSourceConfig {
  sourceId: string;
  pool?: PostgresPoolLike;
  connectionString?: string;
  connectionStringEnv?: string;
  tables?: readonly DataSourceTableConfig[];
  batchSize?: number;
}

interface NormalizedPostgresSourceConfig extends PostgresDataSourceSourceConfig {
  sourceId: string;
  batchSize: number;
}

export function createPostgresDataSourceExecutor(
  config: PostgresDataSourceConfig
): PostgresDataSourceExecutor {
  return new PostgresDataSourceExecutor(config);
}

export class PostgresDataSourceExecutor implements DataSourceQueryExecutor {
  private readonly sources = new Map<string, NormalizedPostgresSourceConfig>();
  private readonly ownedPools = new Map<string, PostgresPoolLike>();

  constructor(config: PostgresDataSourceConfig) {
    if (config.sources.length === 0) {
      throw new Error("at least one PostgreSQL datasource source is required");
    }
    for (const source of config.sources) {
      const normalized = normalizeSource(source, config.defaultBatchSize);
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

    const pool = await this.poolForSource(source);
    const client = await pool.connect();
    let queryStream: QueryStreamLike | undefined;
    let committed = false;

    try {
      await promiseQuery(client, "BEGIN READ ONLY");
      if ((req.timeoutMs ?? 0) > 0) {
        await promiseQuery(
          client,
          `SET LOCAL statement_timeout = ${Math.trunc(req.timeoutMs ?? 0)}`
        );
      }

      const QueryStream = await loadQueryStream();
      queryStream = new QueryStream(queryWithRowLimit(req.query, req.rowLimit), [], {
        batchSize: source.batchSize,
        highWaterMark: source.batchSize,
        rowMode: "array",
      }) as QueryStreamLike;

      const stream = client.query(queryStream) as AsyncIterable<readonly unknown[]>;
      const startedAt = Date.now();
      const byteLimit = new DataSourceByteLimitTracker(req.byteLimit);
      const batch: (readonly unknown[])[] = [];
      let rowCount = 0;
      let schemaSent = false;

      for await (const row of stream) {
        batch.push(row);
        rowCount++;
        if (batch.length >= source.batchSize) {
          schemaSent = flushBatch(sink, queryStream, batch, schemaSent, byteLimit);
          batch.length = 0;
        }
      }
      if (batch.length > 0) {
        schemaSent = flushBatch(sink, queryStream, batch, schemaSent, byteLimit);
      }
      if (!schemaSent) {
        const fields = fieldsFromQueryStream(queryStream);
        if (fields.length > 0) {
          writeRowsAsArrowIpcBatch(sink, fields, [], {
            sendSchema: true,
            byteLimit,
          });
        }
      }

      await promiseQuery(client, "COMMIT");
      committed = true;
      sink.send({
        result: { rowCount, limitExceeded: false, executionMs: Date.now() - startedAt },
      });
    } catch (error) {
      queryStream?.destroy?.(error);
      if (!committed) {
        await rollback(client);
      }
      throw toPostgresDataSourceError(error);
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    const pools = [...this.ownedPools.values()];
    this.ownedPools.clear();
    for (const pool of pools) {
      await pool.end?.();
    }
  }

  private async poolForSource(source: NormalizedPostgresSourceConfig): Promise<PostgresPoolLike> {
    if (source.pool) {
      return source.pool;
    }
    const existing = this.ownedPools.get(source.sourceId);
    if (existing) {
      return existing;
    }
    const connectionString =
      source.connectionString ??
      (source.connectionStringEnv ? process.env[source.connectionStringEnv] : undefined);
    if (!connectionString?.trim()) {
      throw new DataSourceExecutionError({
        code: DataSourceErrorCode.Unavailable,
        message: `PostgreSQL connection string is required for source_id ${source.sourceId}`,
      });
    }
    const pg = await loadPg();
    const pool = new pg.Pool({ connectionString });
    this.ownedPools.set(source.sourceId, pool);
    return pool;
  }
}

function flushBatch(
  sink: QueryChunkSink,
  queryStream: QueryStreamLike,
  rows: readonly (readonly unknown[])[],
  schemaAlreadySent: boolean,
  byteLimit: DataSourceByteLimitTracker
): boolean {
  const fields = fieldsFromQueryStream(queryStream);
  if (fields.length === 0) {
    throw new Error("PostgreSQL query fields are missing");
  }
  const result = writeRowsAsArrowIpcBatch(sink, fields, rows, {
    sendSchema: !schemaAlreadySent,
    byteLimit,
  });
  return schemaAlreadySent || result.schemaSent;
}

function normalizeSource(
  source: PostgresDataSourceSourceConfig,
  defaultBatchSize: number | undefined
): NormalizedPostgresSourceConfig {
  const sourceId = source.sourceId.trim();
  if (!sourceId) {
    throw new Error("source_id is required");
  }
  return {
    ...source,
    sourceId,
    batchSize: positiveInt(source.batchSize ?? defaultBatchSize, defaultBatchSize),
  };
}

function positiveInt(value: number | undefined, fallback = defaultBatchSize): number {
  if (value === undefined || value <= 0) {
    return fallback > 0 ? fallback : defaultBatchSize;
  }
  return Math.trunc(value);
}

interface NormalizedPostgresQueryRequest {
  sourceId: string;
  query: string;
  rowLimit: number | undefined;
  byteLimit: number | undefined;
  timeoutMs: number | undefined;
}

function normalizeRequest(request: ExecuteQueryRequest): NormalizedPostgresQueryRequest {
  return {
    sourceId: request.sourceId?.trim() ?? "",
    query: request.query?.trim() ?? "",
    rowLimit: request.rowLimit,
    byteLimit: request.byteLimit,
    timeoutMs: request.timeoutMs,
  };
}

function fieldsFromQueryStream(queryStream: QueryStreamLike): ArrowField[] {
  const fields = queryStream._result?.fields ?? [];
  return fields.map((field) => {
    const decimalMetadata = postgresNumericMetadata(field);
    return {
      name: field.name,
      dataTypeID: field.dataTypeID,
      nullable: true,
      ...decimalMetadata,
    };
  });
}

function postgresNumericMetadata(
  field: PgFieldLike
): { precision: number; scale: number } | undefined {
  if (
    field.dataTypeID !== 1700 ||
    field.dataTypeModifier === undefined ||
    field.dataTypeModifier < 0
  ) {
    return undefined;
  }

  const modifier = field.dataTypeModifier - 4;
  if (modifier < 0) {
    return undefined;
  }
  return {
    precision: (modifier >> 16) & 0xffff,
    scale: modifier & 0xffff,
  };
}

async function promiseQuery(client: PostgresClientLike, query: string): Promise<void> {
  await client.query(query);
}

async function rollback(client: PostgresClientLike): Promise<void> {
  try {
    await promiseQuery(client, "ROLLBACK");
  } catch {
    // Preserve the original query failure.
  }
}

function toPostgresDataSourceError(error: unknown): unknown {
  if (error instanceof DataSourceExecutionError) {
    return error;
  }
  if (error instanceof Error) {
    const upstream: { engine: string; message: string; code?: string } = {
      engine: "postgresql",
      message: error.message,
    };
    const code = errorCode(error);
    if (code) {
      upstream.code = code;
    }
    return new DataSourceExecutionError({
      code: DataSourceErrorCode.ExternalError,
      message: "PostgreSQL datasource query failed",
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

interface QueryStreamLike extends AsyncIterable<readonly unknown[]> {
  _result?: {
    fields?: PgFieldLike[];
  };
  destroy?(error?: unknown): void;
}

interface PgFieldLike {
  name: string;
  dataTypeID: number;
  dataTypeModifier?: number;
}

interface PgModule {
  Pool: new (config: { connectionString: string }) => PostgresPoolLike;
}

type QueryStreamConstructor = new (
  text: string,
  values?: unknown[],
  config?: { batchSize?: number; highWaterMark?: number; rowMode?: "array" }
) => unknown;

async function loadPg(): Promise<PgModule> {
  try {
    return (await importOptionalModule("pg")) as PgModule;
  } catch (error) {
    throw new DataSourceExecutionError({
      code: DataSourceErrorCode.Unavailable,
      message: `pg is required for PostgreSQL datasource execution: ${errorMessage(error)}`,
      cause: error,
    });
  }
}

async function loadQueryStream(): Promise<QueryStreamConstructor> {
  try {
    const mod = (await importOptionalModule("pg-query-stream")) as {
      default: QueryStreamConstructor;
    };
    return mod.default;
  } catch (error) {
    throw new DataSourceExecutionError({
      code: DataSourceErrorCode.Unavailable,
      message: `pg-query-stream is required for PostgreSQL datasource streaming: ${errorMessage(
        error
      )}`,
      cause: error,
    });
  }
}

async function importOptionalModule(specifier: string): Promise<unknown> {
  const mod: unknown = await import(specifier);
  return mod;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
