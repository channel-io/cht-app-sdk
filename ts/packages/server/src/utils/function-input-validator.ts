import { ValidationError } from "@channel.io/app-sdk-core";
import { ZodError, type z } from "zod";
import {
  isMessagingExtensionMethod,
  parseMessagingExtensionInputParams,
} from "./messaging-input-normalizer.js";

export function parseFunctionInputParams<T>(
  functionName: string,
  inputSchema: z.ZodSchema<T>,
  params: unknown
): T {
  try {
    return isMessagingExtensionMethod(functionName)
      ? parseMessagingExtensionInputParams(inputSchema, params)
      : inputSchema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(`Invalid input for function ${functionName}`, error.issues);
    }

    throw error;
  }
}
