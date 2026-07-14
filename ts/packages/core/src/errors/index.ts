/**
 * Base error class for App SDK errors
 */
export class AppSDKError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "AppSDKError";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AppSDKError {
  public readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.details = details;
  }
}

export const FunctionCallErrorCode = {
  UnprocessableEntity: 1,
  BadRequest: 2,
  NotFound: 3,
  Conflict: 4,
  Internal: -32603,
} as const;

export type FunctionCallErrorCode =
  (typeof FunctionCallErrorCode)[keyof typeof FunctionCallErrorCode];

export interface FunctionCallErrorOptions {
  data?: unknown;
  type?: string;
}

/**
 * Error returned to Channel.io as a JSON-RPC function error.
 *
 * Throw this from a function handler when the function call itself should fail
 * with an application-level JSON-RPC error instead of an HTTP 500.
 */
export class FunctionCallError extends AppSDKError {
  public readonly rpcCode: number;
  public readonly data: unknown;
  public readonly type: string | undefined;

  constructor(message: string, rpcCode: number, options: FunctionCallErrorOptions = {}) {
    super(message, "FUNCTION_CALL_ERROR");
    this.name = "FunctionCallError";
    this.rpcCode = rpcCode;
    this.data = options.data;
    this.type = options.type;
  }

  toResponse(): {
    code: number;
    message: string;
    data?: unknown;
    type?: string;
  } {
    return {
      code: this.rpcCode,
      message: this.message,
      ...(this.data !== undefined ? { data: this.data } : {}),
      ...(this.type !== undefined ? { type: this.type } : {}),
    };
  }
}

export class FunctionCallNotFoundError extends FunctionCallError {
  constructor(message = "Resource not found", options: FunctionCallErrorOptions = {}) {
    super(message, FunctionCallErrorCode.NotFound, options);
    this.name = "FunctionCallNotFoundError";
  }
}

/**
 * Error thrown when a function is not found
 */
export class FunctionNotFoundError extends AppSDKError {
  public readonly methodName: string;

  constructor(methodName: string) {
    super(`Function not found: ${methodName}`, "FUNCTION_NOT_FOUND");
    this.name = "FunctionNotFoundError";
    this.methodName = methodName;
  }
}

/**
 * Error thrown when an extension is not found
 */
export class ExtensionNotFoundError extends AppSDKError {
  public readonly extensionName: string;

  constructor(extensionName: string) {
    super(`Extension not found: ${extensionName}`, "EXTENSION_NOT_FOUND");
    this.name = "ExtensionNotFoundError";
    this.extensionName = extensionName;
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends AppSDKError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}
