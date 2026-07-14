import type { CustomTabActionResult, GetCustomTabsOutput } from "../customtab.js";
import type { Context } from "../../types/context.js";
import type {
  CustomTabActionInput as ProtoCustomTabActionInput,
  CustomTabGetCustomTabsInput as ProtoGetCustomTabsInput,
} from "../../gen/channel/app/sdk/v1/extension.js";

/**
 * Custom tab metadata input/output types
 */
export type GetCustomTabsInput = ProtoGetCustomTabsInput;
export type CustomTabActionInput = ProtoCustomTabActionInput;

/**
 * Custom tab metadata extension interface
 *
 * Implement this interface to expose custom tab definitions for AppStore registration.
 *
 * @example
 * ```typescript
 * @Extension({ name: "customtab", systemVersion: "v1" })
 * export class MyCustomTabExtension implements CustomTabMetadataExtensionInterface {
 *   @Func("metadata.getCustomTabs")
 *   async getCustomTabs(ctx, params): Promise<GetCustomTabsOutput> {
 *     return {
 *       customTabs: [
 *         {
 *           name: "analytics",
 *           actionFunctionName: "customtabs.analytics.action",
 *           nameI18nMap: {
 *             ko: { name: "분석" },
 *             ja: { name: "分析" },
 *           },
 *         },
 *       ],
 *     };
 *   }
 * }
 * ```
 */
export interface CustomTabMetadataExtensionInterface {
  /**
   * Get custom tab definitions for AppStore registration
   *
   * Function name: "metadata.getCustomTabs"
   */
  getCustomTabs(ctx: Context, params: GetCustomTabsInput): Promise<GetCustomTabsOutput>;
}

/**
 * Custom tab extension interface
 *
 * Custom tab registration is driven by `metadata.getCustomTabs`. The runtime
 * action function is a plain app function referenced by each tab's
 * `actionFunctionName`, so it may live inside or outside the extension class.
 *
 * @example
 * ```typescript
 * @Extension({ name: "customtab", systemVersion: "v1" })
 * export class MyCustomTabExtension implements CustomTabExtensionInterface {
 *   @Func("metadata.getCustomTabs")
 *   async getCustomTabs(ctx, params): Promise<GetCustomTabsOutput> {
 *     return {
 *       customTabs: [
 *         {
 *           name: "analytics",
 *           actionFunctionName: "customtabs.analytics.action",
 *           nameI18nMap: {
 *             ko: { name: "분석" },
 *           },
 *         },
 *       ],
 *     };
 *   }
 * }
 *
 * export class CustomTabFunctions {
 *   @Func("customtabs.analytics.action")
 *   async action(ctx, params): Promise<CustomTabActionResult> {
 *     return {
 *       type: "wam",
 *       attributes: {
 *         appId: process.env.APP_ID,
 *         name: "analytics-dashboard",
 *         wamArgs: params.wamArgs ?? {},
 *       },
 *     };
 *   }
 * }
 * ```
 */
export interface CustomTabExtensionInterface extends CustomTabMetadataExtensionInterface {
  /**
   * Optional action function.
   * This is a plain app function referenced by `actionFunctionName`.
   */
  action?(ctx: Context, params: CustomTabActionInput): Promise<CustomTabActionResult>;
}

/**
 * Custom Tab Extension Function Names
 */
export const CustomTabFunctionNames = {
  getCustomTabs: "metadata.getCustomTabs",
  action: "customtab.action",
} as const;
