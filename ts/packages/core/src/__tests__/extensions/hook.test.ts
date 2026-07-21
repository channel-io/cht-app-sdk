import { describe, expect, it } from "vitest";
import { HookConfigSchema, WebhookConfigSchema } from "../../extensions/hook.js";

const endpointToken = "a".repeat(32);

describe("HookConfigSchema", () => {
  it("accepts an app-level public webhook hook", () => {
    expect(
      HookConfigSchema.parse({
        type: "webhook.received",
        targetId: "bcart.orders",
        actionFunctionName: "hooks.bcart.receive",
        systemVersion: "v1",
        webhook: {
          endpointToken,
        },
      })
    ).toEqual({
      type: "webhook.received",
      targetId: "bcart.orders",
      actionFunctionName: "hooks.bcart.receive",
      systemVersion: "v1",
      webhook: {
        endpointToken,
      },
    });
  });

  it("rejects invalid webhook target IDs and endpoint tokens", () => {
    expect(() =>
      HookConfigSchema.parse({
        type: "webhook.received",
        targetId: "invalid target",
        actionFunctionName: "hooks.receive",
        webhook: { endpointToken: "too-short" },
      })
    ).toThrow();
  });

  it("does not allow webhook settings on lifecycle hooks", () => {
    expect(() =>
      HookConfigSchema.parse({
        type: "app.installed",
        actionFunctionName: "hooks.lifecycle.install",
        webhook: {
          endpointToken,
        },
      })
    ).toThrow();
  });
});

describe("WebhookConfigSchema", () => {
  it("accepts URL-safe capability tokens up to 128 characters", () => {
    expect(WebhookConfigSchema.parse({ endpointToken: "a".repeat(128) })).toEqual({
      endpointToken: "a".repeat(128),
    });
  });
});
