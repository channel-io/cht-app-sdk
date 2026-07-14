/**
 * AppStore client types
 */

/**
 * AppStore client configuration
 */
export interface AppStoreClientConfig {
  /** App ID */
  appId: string;
  /** App secret */
  appSecret: string;
  /** AppStore API base URL (default: https://app-store.channel.io) */
  appStoreUrl?: string | undefined;
  /** Enable debug logging */
  debug?: boolean | undefined;
}

/**
 * JSON-RPC request format
 */
export interface JsonRpcRequest<T = unknown> {
  jsonrpc: "2.0";
  method: string;
  params: T;
  id?: string | number;
}

/**
 * JSON-RPC response format
 */
export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  result?: T;
  error?: JsonRpcError;
  id?: string | number;
}

/**
 * JSON-RPC error format
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * RegisterExtension request params
 */
export interface RegisterExtensionParams {
  app_id: string;
  system_version: string;
  extension_name: string;
}

/**
 * Extension implementation returned from AppStore
 */
export interface ExtensionImpl {
  id: string;
  appId: string;
  extensionName: string;
  systemVersion: string;
  exclusive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * RegisterExtension response result
 */
export interface RegisterExtensionResult {
  success: boolean;
  error_message?: string;
  extensions?: ExtensionImpl[];
  validation_errors?: string[];
}

/**
 * UnregisterExtension request params
 */
export interface UnregisterExtensionParams {
  app_id: string;
  system_version: string;
  extension_name: string;
}

/**
 * UnregisterExtension response result
 */
export interface UnregisterExtensionResult {
  success: boolean;
  error_message?: string;
}
