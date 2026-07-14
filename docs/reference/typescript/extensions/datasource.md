# DataSource Extension

Use DataSource when an app exposes catalog and table metadata to AppStore for
CoS data source discovery. Metadata is JSON-RPC. Query execution is separate:
the app server exposes datasource gRPC `ExecuteQuery`.

The metadata DTOs are also defined in the SDK common proto at
`channel.app.sdk.v1` as `DataSourceListCatalogsInput`,
`DataSourceListCatalogsOutput`, `DataSourceListTablesInput`,
`DataSourceListTablesOutput`, `DataSourceDescribeTableInput`, and
`DataSourceDescribeTableOutput`. The TypeScript zod schemas validate the same
JSON shape and keep app code on camelCase fields.

## Metadata Functions

| Function                | Description                                                               | Required |
| ----------------------- | ------------------------------------------------------------------------- | -------- |
| `catalog.listCatalogs`  | Returns local catalogs such as `bigquery` or `postgresql`                 | Yes      |
| `catalog.listTables`    | Returns lightweight table metadata for discovery and search cache refresh | Yes      |
| `catalog.describeTable` | Returns detailed table columns and keys; may include bounded samples      | Yes      |

```typescript
import { createStaticDataSourceExtension } from "@channel.io/app-sdk-core";

export const datasourceExtension = createStaticDataSourceExtension({
  catalogs: [{ alias: "bigquery", dialect: "bigquery" }],
  tables: [{ table: { name: "orders", localCatalogAlias: "bigquery" } }],
  definitions: [
    {
      table: { name: "orders", localCatalogAlias: "bigquery" },
      columns: [
        {
          name: "channel_id",
          type: "STRING",
          nullable: false,
          partitionKey: true,
        },
        { name: "order_id", type: "STRING", nullable: false },
      ],
      primaryKey: ["channel_id", "order_id"],
    },
  ],
});
```

Samples are optional and must be bounded: at most 10 rows and 64 KiB, with keys
that match the declared columns.

## gRPC Query Server

```typescript
import {
  createDataSourceGrpcServer,
  createBigQueryDataSourceExecutor,
} from "@channel.io/app-sdk-server";

const executor = createBigQueryDataSourceExecutor({
  projectId: "appstudio-project",
  credentialsJsonEnv: "BIGQUERY_CREDENTIALS_JSON",
  sources: [
    {
      sourceId: "bigquery",
      datasetId: "app_cafe24",
      tables: [{ name: "orders" }, { name: "products" }, { name: "carts" }],
      maxStreamCount: 1,
    },
  ],
});

const server = createDataSourceGrpcServer(
  {
    executeQuery: executor.executeQuery.bind(executor),
  },
  {
    allowedSources: ["bigquery"],
    signingKey: process.env.APP_SIGNING_KEY,
  },
);
```

`executeQuery` handlers receive a third `context` argument with normalized gRPC
metadata. AppStore calls datasource gRPC with `x-access-token` and
`x-signature`; the SDK verifies the HMAC signature with the app signing key and
exposes the decoded token as `context.accessTokenIdentity`.

When one shared app server endpoint must dispatch requests for multiple apps,
resolve the signing key from `identity.appId`, then dispatch by
`context.accessTokenIdentity?.appId`.

```typescript
import {
  createDataSourceGrpcServer,
} from "@channel.io/app-sdk-server";

createDataSourceGrpcServer(
  {
    executeQuery: (request, sink, context) => {
      switch (context?.accessTokenIdentity?.appId) {
        case process.env.CAFE24_APP_ID:
          return cafe24Executor.executeQuery(request, sink, context);
        case process.env.SHOPIFY_APP_ID:
          return shopifyExecutor.executeQuery(request, sink, context);
        default:
          throw new Error("unsupported datasource app id");
      }
    },
  },
  {
    signingKeyResolver: (identity) => {
      switch (identity.appId) {
        case process.env.CAFE24_APP_ID:
          return process.env.CAFE24_SIGNING_KEY ?? "";
        case process.env.SHOPIFY_APP_ID:
          return process.env.SHOPIFY_SIGNING_KEY ?? "";
        default:
          throw new Error("unsupported datasource app id");
      }
    },
  },
);
```

`createPostgresDataSourceExecutor(...)` has the same shape and can receive an
existing `pg` pool or create a lazy pool from `connectionString` /
`connectionStringEnv`.

```typescript
import {
  createDataSourceGrpcServer,
  createPostgresDataSourceExecutor,
} from "@channel.io/app-sdk-server";

const executor = createPostgresDataSourceExecutor({
  sources: [
    {
      sourceId: "postgresql",
      connectionStringEnv: "APP_DATABASE_URL",
      tables: [{ name: "orders" }],
      batchSize: 1024,
    },
  ],
});

createDataSourceGrpcServer({
  executeQuery: executor.executeQuery.bind(executor),
});
```

The PostgreSQL runner uses `pg-query-stream` in array row mode, wraps the query
with a row limit when `rowLimit` is present, runs inside `BEGIN READ ONLY`, and
writes Arrow IPC schema/body frames by batch. It does not keep the full result
in memory.

The BigQuery runner creates a query job, waits for the destination result table,
then relays BigQuery Storage API Arrow schema and record batches. It does not
materialize rows as JSON before streaming.

## Optional Dependencies

The server SDK is published as a public npm package, so database and Arrow
runtime dependencies are optional. Install only the runners you use:

| Runner     | Install                                                          |
| ---------- | ---------------------------------------------------------------- |
| PostgreSQL | `pnpm add pg pg-query-stream apache-arrow`                       |
| BigQuery   | `pnpm add @google-cloud/bigquery @google-cloud/bigquery-storage` |
| Arrow rows | `pnpm add apache-arrow`                                          |

These packages are declared as optional peer dependencies and are loaded lazily.
Importing `@channel.io/app-sdk-server` does not require PostgreSQL, BigQuery, or
Arrow packages unless the corresponding runner is executed.

## Policy Boundary

AppStore is still responsible for the authoritative policy: app alias
resolution, AST rewrite, `channel_id` predicate injection, audit logging, and
global row/byte/timeout limits. SDK runners only provide defensive checks:
single read-only SQL validation, optional table allowlist validation, local
row/byte/timeout limits, and consistent datasource error mapping.

For small or custom engines, `createRowQueryHandler(...)`,
`createPostgresQueryHandler(...)`, and `createBigQueryQueryHandler(...)` remain
available as lightweight adapters. Production PostgreSQL and BigQuery data
sources should prefer the executor helpers above.
