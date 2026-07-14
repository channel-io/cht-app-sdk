import { describe, expect, it } from "vitest";
import {
  NativeCreateAppDataTableParamsSchema,
  NativeRegisterAppNotebooksParamsSchema,
  NativeUpsertAppDataTableRowsParamsSchema,
  getNativeFunctionSchemas,
  nativeFunctionSchemaDefinitions,
} from "../../schemas/native.js";

describe("native function schemas", () => {
  it("exposes AppDataTable native function schemas", () => {
    const names = getNativeFunctionSchemas().map((schema) => schema.name);

    expect(names).toEqual([
      "createAppDataTable",
      "createAppDataTableSchema",
      "getAppDataTableSchema",
      "upsertAppDataTableRows",
      "registerAppNotebooks",
      "getAppNotebookVersions",
    ]);
    expect(nativeFunctionSchemaDefinitions).toHaveLength(6);
  });

  it("validates createAppDataTable input", () => {
    expect(() =>
      NativeCreateAppDataTableParamsSchema.parse({
        appId: "app-1",
        tableName: "orders",
        columns: [{ key: "id", name: "ID", type: "OPERATOR_TYPE_STRING" }],
        primaryKeyColumns: ["id"],
      })
    ).not.toThrow();

    expect(() =>
      NativeCreateAppDataTableParamsSchema.parse({
        appId: "app-1",
        tableName: "orders",
        columns: [],
      })
    ).toThrow();
  });

  it("requires bounded row batches for upsertAppDataTableRows", () => {
    expect(() =>
      NativeUpsertAppDataTableRowsParamsSchema.parse({
        channelId: "ch-1",
        appId: "app-1",
        tableName: "orders",
        rows: [{ id: "order-1" }],
      })
    ).not.toThrow();

    expect(() =>
      NativeUpsertAppDataTableRowsParamsSchema.parse({
        channelId: "ch-1",
        appId: "app-1",
        tableName: "orders",
        rows: [],
      })
    ).toThrow();

    expect(() =>
      NativeUpsertAppDataTableRowsParamsSchema.parse({
        channelId: "ch-1",
        appId: "app-1",
        tableName: "orders",
        rows: Array.from({ length: 101 }, (_, index) => ({ id: `order-${index}` })),
      })
    ).toThrow();
  });

  it("validates registerAppNotebooks input", () => {
    expect(() =>
      NativeRegisterAppNotebooksParamsSchema.parse({
        appId: "app-1",
      })
    ).not.toThrow();

    expect(() =>
      NativeRegisterAppNotebooksParamsSchema.parse({
        appId: "",
      })
    ).toThrow();
  });
});
