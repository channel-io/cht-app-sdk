import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import * as grpc from "@grpc/grpc-js";
import * as arrow from "apache-arrow";
import {
  createExecuteQueryContext,
  createBigQueryQueryHandler,
  createDataSourceGrpcServer,
  createPostgresQueryHandler,
  createRoutedExecuteQueryHandler,
  createRowQueryHandler,
  dataSourceSignaturePayload,
  DataSourceErrorCode,
  DataSourceServiceDefinition,
  encodeRowsToArrowIPC,
  serializeExecuteQueryRequestForSignature,
  type QueryChunk,
} from "../datasource/index.js";

describe("datasource query handlers", () => {
  it("encodes DECIMAL, NUMERIC, HUGEINT, and INT256 columns as Arrow decimal types", () => {
    const table = arrow.tableFromIPC(
      encodeRowsToArrowIPC(
        [
          { name: "amount", type: "DECIMAL(20,6)" },
          { name: "wide_amount", databaseType: "NUMERIC(40,6)" },
          { name: "sum_amount", type: "HUGEINT" },
          { name: "big_counter", type: "INT256" },
        ],
        [
          {
            amount: "123.456789",
            wide_amount: "1234567890123456789012345678901234.123456",
            sum_amount: "170141183460469231731687303715884105727",
            big_counter: "12345678901234567890123456789012345678901234567890",
          },
        ]
      )
    );

    const [amount, wideAmount, sumAmount, bigCounter] = table.schema.fields.map(
      (field) => field.type
    ) as [arrow.Decimal, arrow.Decimal, arrow.Decimal, arrow.Decimal];

    expect(amount.precision).toBe(20);
    expect(amount.scale).toBe(6);
    expect(amount.bitWidth).toBe(128);
    expect(wideAmount.precision).toBe(40);
    expect(wideAmount.scale).toBe(6);
    expect(wideAmount.bitWidth).toBe(256);
    expect(sumAmount.precision).toBe(39);
    expect(sumAmount.scale).toBe(0);
    expect(sumAmount.bitWidth).toBe(256);
    expect(bigCounter.precision).toBe(76);
    expect(bigCounter.scale).toBe(0);
    expect(bigCounter.bitWidth).toBe(256);
    expect(table.getChild("amount")?.get(0)?.valueOf(6)).toBe(123.456789);
  });

  it("streams rows as Arrow chunks and a result chunk", async () => {
    const chunks: unknown[] = [];
    const handler = createRowQueryHandler([{ name: "order_id", type: "STRING" }], async () => [
      { order_id: "o-1" },
    ]);

    await handler(
      { session: { channelId: "channel-1" }, sourceId: "bigquery", query: "select 1" },
      {
        send: (chunk) => chunks.push(chunk),
      }
    );

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toMatchObject({ arrow: { dataHeader: expect.any(Uint8Array) } });
    expect(chunks[1]).toMatchObject({
      arrow: { dataHeader: expect.any(Uint8Array), dataBody: expect.any(Uint8Array) },
    });
    expect(chunks[2]).toMatchObject({ result: { rowCount: 1 } });
  });

  it("streams async iterable rows in batches", async () => {
    const chunks: unknown[] = [];
    const handler = createRowQueryHandler(
      [{ name: "order_id", type: "STRING" }],
      async function* () {
        yield { order_id: "o-1" };
        yield { order_id: "o-2" };
      },
      { batchSize: 1 }
    );

    await handler(
      { session: { channelId: "channel-1" }, sourceId: "bigquery", query: "select 1" },
      {
        send: (chunk) => chunks.push(chunk),
      }
    );

    expect(chunks).toHaveLength(4);
    expect(chunks[3]).toMatchObject({ result: { rowCount: 2 } });
  });

  it("supports pg-like clients", async () => {
    const chunks: unknown[] = [];
    const handler = createPostgresQueryHandler(
      {
        query: async () => ({ rows: [{ id: 1 }] }),
      },
      [{ name: "id", type: "INT64" }]
    );

    await handler(
      { session: { channelId: "channel-1" }, sourceId: "postgresql", query: "select 1" },
      {
        send: (chunk) => chunks.push(chunk),
      }
    );

    expect(chunks[chunks.length - 1]).toMatchObject({ result: { rowCount: 1 } });
  });

  it("supports bigquery-like clients", async () => {
    const chunks: unknown[] = [];
    const handler = createBigQueryQueryHandler(
      {
        query: async () => [[{ id: "o-1" }]],
      },
      [{ name: "id", type: "STRING" }]
    );

    await handler(
      { session: { channelId: "channel-1" }, sourceId: "bigquery", query: "select 1" },
      {
        send: (chunk) => chunks.push(chunk),
      }
    );

    expect(chunks[chunks.length - 1]).toMatchObject({ result: { rowCount: 1 } });
  });

  it("prefers BigQuery query streams when available", async () => {
    const chunks: unknown[] = [];
    const handler = createBigQueryQueryHandler(
      {
        query: async () => {
          throw new Error("query should not be used when createQueryStream exists");
        },
        async *createQueryStream() {
          yield { id: "o-1" };
        },
      },
      [{ name: "id", type: "STRING" }]
    );

    await handler(
      { session: { channelId: "channel-1" }, sourceId: "bigquery", query: "select 1" },
      {
        send: (chunk) => chunks.push(chunk),
      }
    );

    expect(chunks[chunks.length - 1]).toMatchObject({ result: { rowCount: 1 } });
  });

  it("serves ExecuteQuery over grpc", async () => {
    const server = createDataSourceGrpcServer(
      {
        executeQuery: createRowQueryHandler([{ name: "id", type: "STRING" }], () => [
          { id: "o-1" },
        ]),
      },
      { allowedSources: ["bigquery"] }
    );
    const address = await bind(server);
    const client = createClient(address);

    try {
      const chunks = await collectExecuteQuery(client, {
        session: { channelId: "channel-1" },
        sourceId: "bigquery",
        query: "select 1",
      });

      expect(chunks).toHaveLength(3);
      expect(chunks[0]?.arrow?.dataHeader?.byteLength).toBeGreaterThan(0);
      expect(chunks[1]?.arrow?.dataBody?.byteLength).toBeGreaterThan(0);
      expect(chunks[2]).toMatchObject({ result: { rowCount: 1 } });
    } finally {
      client.close();
      await forceShutdown(server);
    }
  });

  it("passes grpc metadata to ExecuteQuery handlers", async () => {
    const server = createDataSourceGrpcServer({
      executeQuery: (_request, sink, context) => {
        sink.send({
          result: {
            rowCount: context?.route === "cafe24" ? 1 : 0,
          },
        });
      },
    });
    const address = await bind(server);
    const client = createClient(address);
    const metadata = new grpc.Metadata();
    metadata.set("x-datasource-route", "cafe24");

    try {
      const chunks = await collectExecuteQuery(
        client,
        {
          session: { channelId: "channel-1" },
          sourceId: "bigquery",
          query: "select 1",
        },
        metadata
      );

      expect(chunks[0]).toMatchObject({ result: { rowCount: 1 } });
    } finally {
      client.close();
      await forceShutdown(server);
    }
  });

  it("validates datasource HMAC signature with signing key", async () => {
    const signingKey = Buffer.from("datasource-signing-key").toString("hex");
    const accessToken = signedJWT("auth-secret", {
      identity: "app-cafe24",
      scope: ["app-cafe24", "channel-channel-1", "manager-manager-1"],
    });
    const request = {
      session: { channelId: "channel-1" },
      sourceId: "bigquery",
      query: "select 1",
    };
    const metadata = new grpc.Metadata();
    metadata.set("x-access-token", accessToken);
    metadata.set("x-signature", signDatasourceRequest(signingKey, request, accessToken));
    const server = createDataSourceGrpcServer(
      {
        executeQuery: (_request, sink, context) => {
          sink.send({
            result: {
              rowCount:
                context?.accessTokenIdentity?.appId === "cafe24" &&
                context.accessTokenIdentity.channelId === "channel-1" &&
                context.accessTokenIdentity.managerId === "manager-1"
                  ? 1
                  : 0,
            },
          });
        },
      },
      { signingKey }
    );
    const address = await bind(server);
    const client = createClient(address);

    try {
      const chunks = await collectExecuteQuery(client, request, metadata);
      expect(chunks[0]).toMatchObject({ result: { rowCount: 1 } });
    } finally {
      client.close();
      await forceShutdown(server);
    }
  });

  it("rejects invalid datasource HMAC signature", async () => {
    const signingKey = Buffer.from("datasource-signing-key").toString("hex");
    const accessToken = signedJWT("auth-secret", {
      identity: "app-cafe24",
      scope: ["app-cafe24", "channel-channel-1", "manager-manager-1"],
    });
    const request = {
      session: { channelId: "channel-1" },
      sourceId: "bigquery",
      query: "select 1",
    };
    const metadata = new grpc.Metadata();
    metadata.set("x-access-token", accessToken);
    metadata.set("x-signature", signDatasourceRequest(signingKey, request, `${accessToken}-bad`));
    const server = createDataSourceGrpcServer(
      {
        executeQuery: () => {
          throw new Error("handler must not be called");
        },
      },
      { signingKey }
    );
    const address = await bind(server);
    const client = createClient(address);

    try {
      const result = await collectExecuteQueryFailure(client, request, metadata);
      expect(result.error.code).toBe(grpc.status.UNAUTHENTICATED);
      expect(result.chunks[0]).toMatchObject({
        error: { code: DataSourceErrorCode.Unauthenticated },
      });
    } finally {
      client.close();
      await forceShutdown(server);
    }
  });

  it("resolves datasource HMAC signing key from access token identity", async () => {
    const signingKey = Buffer.from("datasource-signing-key").toString("hex");
    const accessToken = signedJWT("auth-secret", {
      identity: "app-cafe24",
      scope: ["app-cafe24", "channel-channel-1", "manager-manager-1"],
    });
    const request = {
      session: { channelId: "channel-1" },
      sourceId: "bigquery",
      query: "select 1",
    };
    const metadata = new grpc.Metadata();
    metadata.set("x-access-token", accessToken);
    metadata.set("x-signature", signDatasourceRequest(signingKey, request, accessToken));
    const server = createDataSourceGrpcServer(
      {
        executeQuery: (_request, sink, context) => {
          sink.send({
            result: { rowCount: context?.accessTokenIdentity?.appId === "cafe24" ? 1 : 0 },
          });
        },
      },
      {
        signingKeyResolver: (identity) => {
          expect(identity.appId).toBe("cafe24");
          return signingKey;
        },
      }
    );
    const address = await bind(server);
    const client = createClient(address);

    try {
      const chunks = await collectExecuteQuery(client, request, metadata);
      expect(chunks[0]).toMatchObject({ result: { rowCount: 1 } });
    } finally {
      client.close();
      await forceShutdown(server);
    }
  });

  it("resolves datasource app identity from grpc metadata", () => {
    const metadata = new grpc.Metadata();
    metadata.set("x-channel-app-id", "app-fallback-id");

    const idOnlyContext = createExecuteQueryContext(metadata);
    expect(idOnlyContext.appIdentity).toMatchObject({
      appId: "app-fallback-id",
      appSlugOrId: "app-fallback-id",
    });
    expect(idOnlyContext.getMetadataText("X-CHANNEL-APP-ID")).toBe("app-fallback-id");

    metadata.set("x-app-slug", "cafe24");
    const slugContext = createExecuteQueryContext(metadata);
    expect(slugContext.appIdentity).toMatchObject({
      appSlug: "cafe24",
      appId: "app-fallback-id",
      appSlugOrId: "cafe24",
    });
  });

  it("resolves datasource route from grpc metadata", () => {
    const metadata = new grpc.Metadata();
    metadata.set("X-DATASOURCE-ROUTE", " cafe24 ");

    const context = createExecuteQueryContext(metadata);

    expect(context.route).toBe("cafe24");
    expect(context.getMetadataText("x-datasource-route")).toBe(" cafe24 ");
  });

  it("routes ExecuteQuery handlers by datasource route", async () => {
    const chunks: unknown[] = [];
    const handler = createRoutedExecuteQueryHandler({
      cafe24: async (_request, sink) => {
        sink.send({ result: { rowCount: 1 } });
      },
      shopify: async (_request, sink) => {
        sink.send({ result: { rowCount: 2 } });
      },
    });

    await handler(
      { session: { channelId: "channel-1" }, sourceId: "bigquery", query: "select 1" },
      { send: (chunk) => chunks.push(chunk) },
      { ...createExecuteQueryContext(new grpc.Metadata()), route: "shopify" }
    );

    expect(chunks[0]).toMatchObject({ result: { rowCount: 2 } });
  });

  it("returns terminal error chunks and grpc status", async () => {
    const server = createDataSourceGrpcServer(
      {
        executeQuery: createRowQueryHandler([{ name: "id", type: "STRING" }], () => [
          { id: "o-1" },
        ]),
      },
      { allowedSources: ["bigquery"] }
    );
    const address = await bind(server);
    const client = createClient(address);

    try {
      const result = await collectExecuteQueryFailure(client, {
        session: { channelId: "channel-1" },
        sourceId: "postgresql",
        query: "select 1",
      });

      expect(result.chunks[0]).toMatchObject({
        error: { code: DataSourceErrorCode.SourceNotFound },
      });
      expect(result.error.code).toBe(grpc.status.NOT_FOUND);
    } finally {
      client.close();
      await forceShutdown(server);
    }
  });

  it("exports datasource error codes", () => {
    expect(DataSourceErrorCode.SourceNotFound).toBe(4);
  });
});

function bind(server: grpc.Server): Promise<string> {
  return new Promise((resolve, reject) => {
    server.bindAsync("127.0.0.1:0", grpc.ServerCredentials.createInsecure(), (error, port) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(`127.0.0.1:${port}`);
    });
  });
}

function createClient(address: string): grpc.Client & {
  ExecuteQuery(request: unknown, metadata?: grpc.Metadata): grpc.ClientReadableStream<QueryChunk>;
} {
  const Client = grpc.makeGenericClientConstructor(
    DataSourceServiceDefinition,
    "DataSourceService"
  );
  return new Client(address, grpc.credentials.createInsecure()) as unknown as grpc.Client & {
    ExecuteQuery(request: unknown, metadata?: grpc.Metadata): grpc.ClientReadableStream<QueryChunk>;
  };
}

function collectExecuteQuery(
  client: ReturnType<typeof createClient>,
  request: unknown,
  metadata?: grpc.Metadata
): Promise<QueryChunk[]> {
  return new Promise((resolve, reject) => {
    const chunks: QueryChunk[] = [];
    const stream = metadata ? client.ExecuteQuery(request, metadata) : client.ExecuteQuery(request);
    stream.on("data", (chunk: QueryChunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(chunks));
  });
}

function collectExecuteQueryFailure(
  client: ReturnType<typeof createClient>,
  request: unknown,
  metadata?: grpc.Metadata
): Promise<{ chunks: QueryChunk[]; error: grpc.ServiceError }> {
  return new Promise((resolve, reject) => {
    const chunks: QueryChunk[] = [];
    const stream = metadata ? client.ExecuteQuery(request, metadata) : client.ExecuteQuery(request);
    stream.on("data", (chunk: QueryChunk) => chunks.push(chunk));
    stream.on("error", (error: grpc.ServiceError) => resolve({ chunks, error }));
    stream.on("end", () => reject(new Error("expected ExecuteQuery to fail")));
  });
}

function forceShutdown(server: grpc.Server): Promise<void> {
  server.forceShutdown();
  return Promise.resolve();
}

function signedJWT(secret: string, payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest()
    .toString("base64url");
  return `${header}.${body}.${signature}`;
}

function signDatasourceRequest(
  signingKey: string,
  request: Parameters<typeof serializeExecuteQueryRequestForSignature>[0],
  accessToken: string
): string {
  return createHmac("sha256", Buffer.from(signingKey, "hex"))
    .update(
      dataSourceSignaturePayload(serializeExecuteQueryRequestForSignature(request), accessToken)
    )
    .digest()
    .toString("base64");
}
