# DataSource Extension

Use DataSource when an app exposes catalog and table metadata to AppStore for
Channel data source discovery. Metadata is JSON-RPC. Query execution is separate:
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
import { z } from "zod";
import {
  DataSourceFunctionNames,
  DescribeTableInputSchema,
  DescribeTableOutputSchema,
  Extension,
  Func,
  Input,
  InputSchema,
  ListCatalogsInputSchema,
  ListCatalogsOutputSchema,
  ListTablesInputSchema,
  ListTablesOutputSchema,
  OutputSchema,
} from "@channel.io/app-sdk-server";

@Extension({ name: "datasource", systemVersion: "v1" })
export class DataSourceExtension {
  @Func(DataSourceFunctionNames.listCatalogs)
  @InputSchema(ListCatalogsInputSchema)
  @OutputSchema(ListCatalogsOutputSchema)
  listCatalogs() {
    return { catalogs: [{ alias: "warehouse", dialect: "bigquery" }] };
  }

  @Func(DataSourceFunctionNames.listTables)
  @InputSchema(ListTablesInputSchema)
  @OutputSchema(ListTablesOutputSchema)
  listTables() {
    return {
      tables: [
        {
          table: {
            name: "orders",
            localCatalogAlias: "warehouse",
            managerAccess: "owner",
          },
        },
      ],
    };
  }

  @Func(DataSourceFunctionNames.describeTable)
  @InputSchema(DescribeTableInputSchema)
  @OutputSchema(DescribeTableOutputSchema)
  describeTable(@Input() input: z.infer<typeof DescribeTableInputSchema>) {
    if (input.tableName !== "orders") throw new Error("table not found");
    return {
      definition: {
        table: { name: "orders", localCatalogAlias: "warehouse" },
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
    };
  }
}
```

List `DataSourceExtension` in the NestJS module's `providers`. The lower-level `createStaticDataSourceExtension()` export builds an `ExtensionDefinition`; `ChannelAppModule` does not consume that definition directly.

Set `managerAccess` to `"owner"` when only channel Owner-role managers may
discover, describe, or query a table. Use `"all"`, or omit the field, to allow
all channel managers. AppStore is the authorization authority; this metadata
does not change the datasource gRPC runner's local table allowlist.

Samples are optional and must be bounded: at most 10 rows and 64 KiB, with keys
that match the declared columns.

## gRPC Query Server

```typescript
import {
  createDataSourceGrpcServer,
  createBigQueryDataSourceExecutor,
} from "@channel.io/app-sdk-server";

const executor = createBigQueryDataSourceExecutor({
  projectId: "example-project",
  credentialsJsonEnv: "BIGQUERY_CREDENTIALS_JSON",
  sources: [
    {
      sourceId: "bigquery",
      datasetId: "example_dataset",
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
import { createDataSourceGrpcServer } from "@channel.io/app-sdk-server";

createDataSourceGrpcServer(
  {
    executeQuery: (request, sink, context) => {
      switch (context?.accessTokenIdentity?.appId) {
        case process.env.APP_A_ID:
          return appAExecutor.executeQuery(request, sink, context);
        case process.env.APP_B_ID:
          return appBExecutor.executeQuery(request, sink, context);
        default:
          throw new Error("unsupported datasource app id");
      }
    },
  },
  {
    signingKeyResolver: (identity) => {
      switch (identity.appId) {
        case process.env.APP_A_ID:
          return process.env.APP_A_SIGNING_KEY ?? "";
        case process.env.APP_B_ID:
          return process.env.APP_B_SIGNING_KEY ?? "";
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

AppStore remains the authority for app identity, permissions, tenant isolation,
auditing, and global limits. SDK runners add local defensive checks such as
read-only query validation, optional table allowlists, local resource limits,
and consistent datasource error mapping.

For small or custom engines, `createRowQueryHandler(...)`,
`createPostgresQueryHandler(...)`, and `createBigQueryQueryHandler(...)` remain
available as lightweight adapters. Production PostgreSQL and BigQuery data
sources should prefer the executor helpers above.
