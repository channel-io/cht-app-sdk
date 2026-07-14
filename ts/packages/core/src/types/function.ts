import type { z } from "zod";
import type { Context } from "./context.js";
import type {
  FunctionSchema as ProtoFunctionSchema,
  GetFunctionsResult as ProtoGetFunctionsResult,
} from "../gen/channel/app/sdk/v1/function.js";

/**
 * Function handler type
 */
export type FunctionHandler<TInput = unknown, TOutput = unknown> = (
  ctx: Context,
  params: TInput
) => Promise<TOutput> | TOutput;

/**
 * Function definition configuration
 */
export interface FunctionDefinition<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType,
> {
  /** Function description for documentation */
  description?: string;
  /** Zod schema for input validation */
  input: TInput;
  /** Zod schema for output validation (optional) */
  output?: TOutput;
  /** Function handler */
  handler: FunctionHandler<z.infer<TInput>, z.infer<TOutput>>;
}

/**
 * Registered function with metadata
 */
export interface RegisteredFunction {
  /** Full function name (e.g., "calendar.booking.createBooking") */
  name: string;
  /** Function description */
  description?: string;
  /** JSON Schema for input */
  inputSchema: Record<string, unknown>;
  /** JSON Schema for output */
  outputSchema?: Record<string, unknown>;
  /** Function handler */
  handler: FunctionHandler;
}

/**
 * Function schema for getFunctions response
 */
export interface FunctionSchema extends Omit<
  ProtoFunctionSchema,
  "name" | "inputSchema" | "outputSchema"
> {
  /** Full function name */
  name: string;
  /** Function description */
  description?: string;
  /** JSON Schema for input parameters */
  inputSchema: Record<string, unknown>;
  /** JSON Schema for output */
  outputSchema?: Record<string, unknown>;
}

export interface GetFunctionsResult extends Omit<
  ProtoGetFunctionsResult,
  "functions" | "success" | "errorMessage"
> {
  functions: FunctionSchema[];
  success: boolean;
  errorMessage: string;
}

/**
 * Response type for extension.core.function.getFunctions
 */
export interface GetFunctionsResponse {
  result: GetFunctionsResult;
}

/**
 * Response type for extension.core.function.getTestFunctions
 */
export type GetTestFunctionsResponse = GetFunctionsResponse;
