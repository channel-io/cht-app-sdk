import { describe, expect, it } from "vitest";
import { sanitizeForLogging } from "../utils/sanitize-for-logging.js";

describe("sanitizeForLogging", () => {
  it("should redact snake_case and kebab-case sensitive keys", () => {
    expect(
      sanitizeForLogging({
        access_token: "access-123",
        "refresh-token": "refresh-456",
        "x-access-token": "x-access-789",
        api_key: "api-key-000",
        client_secret: "client-secret-111",
        auth_token: "auth-token-222",
      })
    ).toEqual({
      access_token: "[REDACTED]",
      "refresh-token": "[REDACTED]",
      "x-access-token": "[REDACTED]",
      api_key: "[REDACTED]",
      client_secret: "[REDACTED]",
      auth_token: "[REDACTED]",
    });
  });

  it("should keep non-sensitive keys unchanged", () => {
    expect(
      sanitizeForLogging({
        channelId: "channel-1",
        status: "ok",
      })
    ).toEqual({
      channelId: "channel-1",
      status: "ok",
    });
  });
});
