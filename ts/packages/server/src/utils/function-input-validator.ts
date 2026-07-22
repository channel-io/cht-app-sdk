import { ValidationError } from "@channel.io/app-sdk-core";
import type { z } from "zod";
import {
  isMessagingExtensionMethod,
  parseMessagingExtensionInputParams,
} from "./messaging-input-normalizer.js";

interface ZodErrorLike {
  name: "ZodError";
  issues: unknown[];
}

function isZodErrorLike(error: unknown): error is ZodErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ZodError" &&
    "issues" in error &&
    Array.isArray(error.issues)
  );
}

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
    if (isZodErrorLike(error)) {
      throw new ValidationError(`Invalid input for function ${functionName}`, error.issues);
    }

    throw error;
  }
}
