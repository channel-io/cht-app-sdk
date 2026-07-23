import { describe, expect, it } from "vitest";
import {
  NativeCreateAppDataTableParamsSchema,
  NativeMailRelayGetRawMimeParamsSchema,
  NativeMailRelayGetRawMimeResultSchema,
  NativeMailRelaySendRawEmailParamsSchema,
  NativeMailRelaySendRawEmailResultSchema,
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
      "mailRelay.getRawMime",
      "mailRelay.sendRawEmail",
    ]);
    expect(nativeFunctionSchemaDefinitions).toHaveLength(8);
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

  it("validates mailRelay.getRawMime params and result", () => {
    expect(
      NativeMailRelayGetRawMimeParamsSchema.parse({
        recipient:
          "amazon+c_channel.i_installation.m_marketplace.r_token@amazon.app.mail.channel.io",
        sesMessageId: "ses-message-1",
        bucketName: "channel-inbound-mail",
        objectKey: "app-mail/ses-message-1",
      })
    ).toEqual({
      recipient: "amazon+c_channel.i_installation.m_marketplace.r_token@amazon.app.mail.channel.io",
      sesMessageId: "ses-message-1",
      bucketName: "channel-inbound-mail",
      objectKey: "app-mail/ses-message-1",
    });

    expect(() =>
      NativeMailRelayGetRawMimeParamsSchema.parse({
        recipient: "amazon@example.com",
        sesMessageId: "ses-message-1",
        bucketName: "channel-inbound-mail",
        objectKey: "../other-prefix/ses-message-1",
      })
    ).toThrow();

    expect(
      NativeMailRelayGetRawMimeResultSchema.parse({
        sesMessageId: "ses-message-1",
        contentType: "message/rfc822",
        encoding: "utf8",
        rawMime: "From: buyer@example.com\n\nHello",
        size: 31,
      }).encoding
    ).toBe("utf8");
  });

  it("validates mailRelay.sendRawEmail params and result", () => {
    expect(
      NativeMailRelaySendRawEmailParamsSchema.parse({
        sender: "amazon-buyer-reply@app.mail.channel.io",
        recipients: ["buyer-alias@marketplace.amazon.com"],
        rawMime: "From: amazon-buyer-reply@app.mail.channel.io\n\nHello",
        idempotencyKey: "channel-message-1",
        metadata: {
          channelId: "channel-1",
          appId: "amazon",
          userChatId: "user-chat-1",
        },
      }).recipients
    ).toEqual(["buyer-alias@marketplace.amazon.com"]);

    expect(() =>
      NativeMailRelaySendRawEmailParamsSchema.parse({
        sender: "amazon-buyer-reply@app.mail.channel.io",
        recipients: [],
        rawMime: "From: amazon-buyer-reply@app.mail.channel.io\n\nHello",
        idempotencyKey: "channel-message-1",
      })
    ).toThrow();

    expect(
      NativeMailRelaySendRawEmailResultSchema.parse({
        providerMessageId: "010201902a",
        idempotencyStatus: "sent",
        sentAt: "2026-07-15T13:24:09.000Z",
      }).idempotencyStatus
    ).toBe("sent");
  });
});
