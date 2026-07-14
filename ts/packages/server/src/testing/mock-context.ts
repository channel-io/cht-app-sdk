import type { Context } from "@channel.io/app-sdk-core";

/**
 * Options for creating a mock context
 */
export interface MockContextOptions {
  /** Channel ID (default: "test-channel-id") */
  channelId?: string;
  /** Caller type (default: "manager") */
  callerType?: "user" | "manager" | "system";
  /** Caller ID (default: "test-caller-id") */
  callerId?: string;
  /** Auth token (optional) */
  authToken?: string;
  /** API credentials (optional) */
  apiCredentials?: Record<string, string>;
  /** Stored config values (optional) */
  config?: Record<string, unknown>;
}

/**
 * Create a mock function context for testing
 *
 * @example
 * ```typescript
 * const ctx = createMockContext({
 *   channelId: "my-channel",
 *   callerType: "user",
 *   callerId: "user-123",
 * });
 *
 * const result = await extension.myFunction(ctx, params);
 * ```
 */
export function createMockContext(options: MockContextOptions = {}): Context {
  const ctx: Context = {
    channel: {
      id: options.channelId ?? "test-channel-id",
    },
    caller: {
      type: options.callerType ?? "manager",
      id: options.callerId ?? "test-caller-id",
    },
  };

  if (options.authToken !== undefined) {
    ctx.authToken = options.authToken;
  }

  if (options.apiCredentials !== undefined) {
    ctx.apiCredentials = options.apiCredentials;
  }

  if (options.config !== undefined) {
    ctx.config = options.config;
  }

  return ctx;
}
