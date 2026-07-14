import type { FunctionDefinition } from "./function.js";

/**
 * Available extension names
 */
export type ExtensionName =
  | "oauth"
  | "config"
  /**
   * @deprecated Prefer "config" for new setup surfaces. "apikey" remains for
   * backward-compatible registration only.
   */
  | "apikey"
  | "calendar"
  | "messaging"
  | "messenger"
  | "command"
  | "widget"
  | "customtab"
  | "hook"
  | "polling"
  | "store"
  | "datasource"
  | "commerce"
  | "order"
  | "wms"
  | "alfTask"
  | "notebook"
  | (string & {});

/**
 * Extension configuration
 */
export interface ExtensionConfig {
  /** Extension name (e.g., "calendar", "oauth") */
  name: ExtensionName;
  /** System version (e.g., "v1", "v2") */
  systemVersion?: string;
  /** Whether this is an exclusive extension (only one app can be default) */
  exclusive?: boolean;
}

/**
 * Function group configuration
 */
export interface FunctionGroupConfig {
  /** Whether this function group is required */
  required?: boolean;
  /** Dependencies on other function groups */
  dependencies?: string[];
}

/**
 * Function group containing multiple functions
 */
export type FunctionGroup<
  TFunctions extends Record<string, FunctionDefinition> = Record<string, FunctionDefinition>,
> = {
  /** Function group configuration */
  _config?: FunctionGroupConfig;
} & TFunctions;

/**
 * Extension definition with function groups
 */
export interface ExtensionDefinition<
  TGroups extends Record<string, FunctionGroup> = Record<string, FunctionGroup>,
> extends ExtensionConfig {
  /** Function groups */
  groups: TGroups;
}

/**
 * Registered extension with metadata
 */
export interface RegisteredExtension {
  /** Extension name */
  name: string;
  /** System version (e.g., "v1", "v2") */
  systemVersion: string;
  /** Whether exclusive */
  exclusive: boolean;
  /** Function groups with their functions */
  groups: Map<string, Map<string, FunctionDefinition>>;
}
