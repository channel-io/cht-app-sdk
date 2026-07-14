import { describe, expect, it } from "vitest";
import type {
  DataSourceDescribeTableOutput as ProtoDescribeTableOutput,
  DataSourceListCatalogsOutput as ProtoListCatalogsOutput,
} from "../../gen/channel/app/sdk/v1/extension.js";
import {
  createDataSourceDedupKey,
  createDataSourceExtension,
  createDataSourceIngestionEventRow,
  createStaticDataSourceExtension,
  DataSourceFunctionNames,
  DescribeTableOutputSchema,
  ListCatalogsOutputSchema,
  validateDataSourceSample,
} from "../../extensions/index.js";
import { registerExtension } from "../../schemas/index.js";

const tableDefinition = {
  table: {
    name: "orders",
    localCatalogAlias: "bigquery",
    description: "Cafe24 orders synced to BigQuery.",
    tableType: "table" as const,
  },
  columns: [
    { name: "channel_id", type: "STRING", nullable: false, partitionKey: true },
    { name: "order_id", type: "STRING", nullable: false },
  ],
  primaryKey: ["channel_id", "order_id"],
};

describe("datasource extension schemas", () => {
  it("accepts datasource catalog and describe table outputs", () => {
    const catalogs = ListCatalogsOutputSchema.parse({
      catalogs: [{ alias: "bigquery", dialect: "bigquery", displayName: "Cafe24 BigQuery" }],
    });
    const described = DescribeTableOutputSchema.parse({
      definition: tableDefinition,
      sample: [{ channel_id: "channel-1", order_id: "o-1" }],
    });
    const protoCatalogs: ProtoListCatalogsOutput = catalogs;
    const protoDescribed: ProtoDescribeTableOutput = described;

    expect(protoCatalogs.catalogs?.[0]?.dialect).toBe("bigquery");
    expect(protoDescribed.definition?.primaryKey).toEqual(["channel_id", "order_id"]);
  });

  it("creates required metadata functions", async () => {
    const extension = createDataSourceExtension({
      listCatalogs: async () => ({
        catalogs: [{ alias: "bigquery", dialect: "bigquery" }],
      }),
      listTables: async () => ({
        tables: [{ table: { name: "orders", localCatalogAlias: "bigquery" } }],
      }),
      describeTable: async () => ({ definition: tableDefinition }),
    });
    const registered = registerExtension(extension);

    expect(registered.name).toBe("datasource");
    expect(registered.functions.map((fn) => fn.name)).toEqual([
      "catalog.listCatalogs",
      "catalog.listTables",
      "catalog.describeTable",
    ]);
  });

  it("creates static metadata functions with paging and samples", async () => {
    const extension = createStaticDataSourceExtension({
      catalogs: [{ alias: "bigquery", dialect: "bigquery" }],
      tables: [
        { table: { name: "orders", localCatalogAlias: "bigquery" } },
        { table: { name: "products", localCatalogAlias: "bigquery" } },
      ],
      definitions: [tableDefinition],
      samples: {
        ["bigquery\u0000orders"]: [{ channel_id: "channel-1", order_id: "o-1" }],
      },
    });
    const registered = registerExtension(extension);
    const listTables = registered.functions.find((fn) => fn.name === "catalog.listTables");
    const describeTable = registered.functions.find((fn) => fn.name === "catalog.describeTable");

    const listResult = await listTables?.handler(
      { caller: { id: "manager-1" }, channel: { id: "channel-1" }, app: { id: "app-1" } },
      { localCatalogAlias: "bigquery", limit: 1 }
    );
    const describeResult = await describeTable?.handler(
      { caller: { id: "manager-1" }, channel: { id: "channel-1" }, app: { id: "app-1" } },
      { tableName: "orders", localCatalogAlias: "bigquery", includeSample: true }
    );

    expect(listResult).toMatchObject({ nextPageToken: "1" });
    expect(describeResult).toMatchObject({
      sample: [{ channel_id: "channel-1", order_id: "o-1" }],
    });
  });

  it("rejects samples with unknown columns", () => {
    expect(() => validateDataSourceSample(tableDefinition, [{ unknown: "value" }])).toThrow();
  });

  it("creates deterministic datasource ingestion event rows", () => {
    const row = createDataSourceIngestionEventRow({
      kind: "order",
      channelId: "channel-1",
      logicalId: "po-1",
      eventType: "PAYED",
      sourceUpdatedAt: "2026-07-01T10:00:00+09:00",
      source: "naver-smart-store",
      row: { product_order_id: "po-1", amount: 1000 },
      raw: { b: 2, a: 1 },
    });
    const dedupKey = createDataSourceDedupKey({
      kind: "order",
      channelId: "channel-1",
      logicalId: "po-1",
      eventType: "PAYED",
      sourceUpdatedAt: "2026-07-01T01:00:00.000Z",
      fingerprint: [{ a: 1, b: 2 }],
    });

    expect(row).toMatchObject({
      product_order_id: "po-1",
      amount: 1000,
      channel_id: "channel-1",
      source_updated_at: "2026-07-01T01:00:00.000Z",
      event_type: "PAYED",
      source: "naver-smart-store",
      raw: { b: 2, a: 1 },
    });
    expect(row.dedup_key).toBe(dedupKey);
  });

  it("exposes extension-relative function names for decorator implementations", () => {
    expect(DataSourceFunctionNames).toEqual({
      listCatalogs: "catalog.listCatalogs",
      listTables: "catalog.listTables",
      describeTable: "catalog.describeTable",
    });
  });
});
