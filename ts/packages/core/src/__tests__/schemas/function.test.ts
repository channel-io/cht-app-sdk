import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createRegisteredFunction } from "../../schemas/function.js";
import type { FunctionDefinition } from "../../types/function.js";

describe("createRegisteredFunction", () => {
  it("should create a registered function with JSON schema", () => {
    const fn: FunctionDefinition = {
      description: "Test function",
      input: z.object({
        foo: z.string(),
        bar: z.number().optional(),
      }),
      output: z.object({
        result: z.boolean(),
      }),
      handler: async () => ({ result: true }),
    };

    const registered = createRegisteredFunction("test.myFunction", fn);

    expect(registered.name).toBe("test.myFunction");
    expect(registered.description).toBe("Test function");
    expect(registered.inputSchema).toBeDefined();
    expect(registered.inputSchema.type).toBe("object");
    expect(registered.handler).toBeDefined();
  });

  it("should wrap handler with validation", async () => {
    const fn: FunctionDefinition = {
      input: z.object({
        count: z.number().min(1),
      }),
      output: z.object({
        doubled: z.number(),
      }),
      handler: async (_ctx, params) => ({ doubled: params.count * 2 }),
    };

    const registered = createRegisteredFunction("math.double", fn);
    const ctx = { caller: { id: "user-1" }, channel: { id: "ch-1" }, app: { id: "app-1" } };

    // Valid input
    const result = await registered.handler(ctx, { count: 5 });
    expect(result).toEqual({ doubled: 10 });
  });

  it("should throw on invalid input", async () => {
    const fn: FunctionDefinition = {
      input: z.object({
        count: z.number().min(1),
      }),
      output: z.object({
        doubled: z.number(),
      }),
      handler: async (_ctx, params) => ({ doubled: params.count * 2 }),
    };

    const registered = createRegisteredFunction("math.double", fn);
    const ctx = { caller: { id: "user-1" }, channel: { id: "ch-1" }, app: { id: "app-1" } };

    // Invalid input (count is 0, but minimum is 1)
    await expect(registered.handler(ctx, { count: 0 })).rejects.toThrow();
  });
});
