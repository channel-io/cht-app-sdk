import { describe, it, expect } from "vitest";
import { z } from "zod";
import { registerExtension, getFullMethodName } from "../../schemas/extension.js";
import type { ExtensionDefinition } from "../../types/extension.js";

describe("registerExtension", () => {
  it("should register extension and extract functions", () => {
    const extension: ExtensionDefinition = {
      name: "calendar",
      systemVersion: "v1",
      groups: {
        booking: {
          createBooking: {
            description: "Create a booking",
            input: z.object({ date: z.string() }),
            output: z.object({ id: z.string() }),
            handler: async () => ({ id: "123" }),
          },
          cancelBooking: {
            description: "Cancel a booking",
            input: z.object({ id: z.string() }),
            output: z.object({ success: z.boolean() }),
            handler: async () => ({ success: true }),
          },
        },
      },
    };

    const registered = registerExtension(extension);

    expect(registered.name).toBe("calendar");
    expect(registered.functions).toHaveLength(2);
    expect(registered.functions.map((f) => f.name)).toContain("booking.createBooking");
    expect(registered.functions.map((f) => f.name)).toContain("booking.cancelBooking");
  });

  it("should skip _config when extracting functions", () => {
    const extension: ExtensionDefinition = {
      name: "test",
      systemVersion: "v1",
      groups: {
        myGroup: {
          _config: { required: true },
          myFunction: {
            input: z.object({}),
            output: z.object({}),
            handler: async () => ({}),
          },
        },
      },
    };

    const registered = registerExtension(extension);

    expect(registered.functions).toHaveLength(1);
    expect(registered.functions[0]?.name).toBe("myGroup.myFunction");
  });
});

describe("getFullMethodName", () => {
  it("should create full method name with extension prefix", () => {
    const result = getFullMethodName("calendar", "booking.createBooking");
    expect(result).toBe("extension.calendar.booking.createBooking");
  });
});
