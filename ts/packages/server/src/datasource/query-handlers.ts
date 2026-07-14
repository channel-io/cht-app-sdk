import {
  resultChunk,
  writeObjectRowsAsArrowIpcBatch,
  type ArrowColumn,
  type ArrowRow,
} from "./arrow.js";
import {
  DataSourceErrorCode,
  DataSourceExecutionError,
  type ExecuteQueryContext,
  type ExecuteQueryHandler,
  type RoutedExecuteQueryHandlerOptions,
} from "./types.js";

export interface RowQueryHandlerOptions {
  batchSize?: number;
}

export type RowSource = Iterable<ArrowRow> | AsyncIterable<ArrowRow>;

export type RowReader = (
  query: string,
  request: Parameters<ExecuteQueryHandler>[0],
  context?: ExecuteQueryContext
) => RowSource | Promise<RowSource>;

export function createRowQueryHandler(
  columns: ArrowColumn[],
  reader: RowReader,
  options: RowQueryHandlerOptions = {}
): ExecuteQueryHandler {
  const batchSize = options.batchSize && options.batchSize > 0 ? options.batchSize : 1024;
  return async (request, sink, context) => {
    const startedAt = Date.now();
    const rows = toAsyncRows(await reader(request.query ?? "", request, context));
    let rowCount = 0;
    let batch: ArrowRow[] = [];
    let schemaSent = false;

    for await (const row of rows) {
      rowCount += 1;
      batch.push(row);
      if (batch.length >= batchSize) {
        const result = writeObjectRowsAsArrowIpcBatch(sink, columns, batch, {
          sendSchema: !schemaSent,
        });
        schemaSent = schemaSent || result.schemaSent;
        batch = [];
      }
    }
    if (batch.length > 0) {
      const result = writeObjectRowsAsArrowIpcBatch(sink, columns, batch, {
        sendSchema: !schemaSent,
      });
      schemaSent = schemaSent || result.schemaSent;
    }
    sink.send(resultChunk(rowCount, false, Date.now() - startedAt));
  };
}

export interface PostgresLikeClient {
  query(query: string): Promise<{ rows: ArrowRow[] }> | { rows: ArrowRow[] };
}

export function createPostgresQueryHandler(
  client: PostgresLikeClient,
  columns: ArrowColumn[],
  options?: RowQueryHandlerOptions
): ExecuteQueryHandler {
  return createRowQueryHandler(
    columns,
    async (query) => {
      const result = await client.query(query);
      return result.rows;
    },
    options
  );
}

export interface BigQueryLikeClient {
  query(
    query: string | { query: string; [key: string]: unknown }
  ): Promise<[ArrowRow[], unknown?] | ArrowRow[]>;
  createQueryStream?: (query: string | { query: string; [key: string]: unknown }) => RowSource;
}

export interface BigQueryQueryHandlerOptions extends RowQueryHandlerOptions {
  queryOptions?: Record<string, unknown>;
  preferQueryStream?: boolean;
}

export function createBigQueryQueryHandler(
  client: BigQueryLikeClient,
  columns: ArrowColumn[],
  options: BigQueryQueryHandlerOptions = {}
): ExecuteQueryHandler {
  return createRowQueryHandler(
    columns,
    async (query) => {
      const request =
        options.queryOptions && Object.keys(options.queryOptions).length > 0
          ? { ...options.queryOptions, query }
          : query;
      if (options.preferQueryStream !== false && client.createQueryStream) {
        return client.createQueryStream(request);
      }
      const result = await client.query(request);
      if (Array.isArray(result[0])) {
        return result[0];
      }
      return result as ArrowRow[];
    },
    options
  );
}

export function createRoutedExecuteQueryHandler(
  handlers: Record<string, ExecuteQueryHandler>,
  options: RoutedExecuteQueryHandlerOptions = {}
): ExecuteQueryHandler {
  const normalizedHandlers = new Map<string, ExecuteQueryHandler>();
  for (const [route, handler] of Object.entries(handlers)) {
    const normalizedRoute = route.trim();
    if (normalizedRoute) {
      normalizedHandlers.set(normalizedRoute, handler);
    }
  }

  return async (request, sink, context) => {
    const route = context?.route?.trim() ?? "";
    const handler =
      route === "" ? options.defaultHandler : (normalizedHandlers.get(route) ?? undefined);
    if (!handler) {
      throw new DataSourceExecutionError({
        code: DataSourceErrorCode.SourceNotFound,
        message: route ? `unknown datasource route: ${route}` : "datasource route is required",
      });
    }
    await handler(request, sink, context);
  };
}

async function* toAsyncRows(source: RowSource): AsyncIterable<ArrowRow> {
  if (isAsyncIterable(source)) {
    for await (const row of source) {
      yield row;
    }
    return;
  }
  for (const row of source) {
    yield row;
  }
}

function isAsyncIterable(source: RowSource): source is AsyncIterable<ArrowRow> {
  return Symbol.asyncIterator in source;
}
