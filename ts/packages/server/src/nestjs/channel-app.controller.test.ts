import { HttpException, HttpStatus } from "@nestjs/common";
import { ValidationError } from "@channel.io/app-sdk-core";
import { describe, expect, it, vi } from "vitest";
import { ChannelAppController } from "./channel-app.controller.js";
import type { ChannelAppService } from "./channel-app.service.js";

describe("ChannelAppController", () => {
  it("returns HTTP 400 for input validation errors", async () => {
    const validationError = new ValidationError("Invalid function input", [
      { code: "invalid_type", path: ["quantity"] },
    ]);
    const service = {
      handleFunctionCall: vi.fn().mockRejectedValue(validationError),
    } as unknown as ChannelAppService;
    const controller = new ChannelAppController(service);

    try {
      await controller.handleVersionedFunctions("v1", {
        method: "extension.cafe.addCartItem",
        context: {
          caller: { type: "manager", id: "manager-1" },
          channel: { id: "channel-1" },
        },
        params: { quantity: "1" },
      });
      expect.fail("Expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const httpError = error as HttpException;
      expect(httpError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(httpError.getResponse()).toEqual({
        error: "VALIDATION_ERROR",
        message: "Invalid function input",
        details: [{ code: "invalid_type", path: ["quantity"] }],
      });
    }
  });
});
