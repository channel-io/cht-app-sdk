import type { GetWidgetsOutput, WidgetActionResult } from "../widget.js";
import type { Context } from "../../types/context.js";
import type {
  WidgetActionInput as ProtoWidgetActionInput,
  WidgetGetWidgetsInput as ProtoGetWidgetsInput,
} from "../../gen/channel/app/sdk/v1/extension.js";

/**
 * Widget metadata input/output types
 */
export type GetWidgetsInput = ProtoGetWidgetsInput;
export type WidgetActionInput = ProtoWidgetActionInput;

/**
 * Widget metadata extension interface
 *
 * Implement this interface to expose widget definitions for AppStore registration.
 *
 * @example
 * ```typescript
 * @Extension({ name: "widget", systemVersion: "v1" })
 * export class MyWidgetExtension implements WidgetMetadataExtensionInterface {
 *   @Func("metadata.getWidgets")
 *   async getWidgets(ctx, params): Promise<GetWidgetsOutput> {
 *     return {
 *       widgets: [
 *         {
 *           name: "quick_actions",
 *           scope: "desk",
 *           widgetType: "wam",
 *           actionFunctionName: "widgets.quickActions.action",
 *           defaultName: "Quick Actions",
 *         },
 *       ],
 *     };
 *   }
 * }
 * ```
 */
export interface WidgetMetadataExtensionInterface {
  /**
   * Get widget definitions for AppStore registration
   *
   * Function name: "metadata.getWidgets"
   */
  getWidgets(ctx: Context, params: GetWidgetsInput): Promise<GetWidgetsOutput>;
}

/**
 * Widget extension interface
 *
 * Widget registration is driven by `metadata.getWidgets`. The runtime action
 * function is a plain app function referenced by each widget's
 * `actionFunctionName`, so it may live inside or outside the extension class.
 *
 * @example
 * ```typescript
 * @Extension({ name: "widget", systemVersion: "v1" })
 * export class MyWidgetExtension implements WidgetExtensionInterface {
 *   @Func("metadata.getWidgets")
 *   async getWidgets(ctx, params): Promise<GetWidgetsOutput> {
 *     return {
 *       widgets: [
 *         {
 *           name: "quick_actions",
 *           scope: "desk",
 *           widgetType: "wam",
 *           actionFunctionName: "widgets.quickActions.action",
 *           defaultName: "Quick Actions",
 *         },
 *       ],
 *     };
 *   }
 * }
 *
 * export class WidgetFunctions {
 *   @Func("widgets.quickActions.action")
 *   async action(ctx, params): Promise<WidgetActionResult> {
 *     return {
 *       type: "wam",
 *       attributes: {
 *         appId: process.env.APP_ID,
 *         name: "quick-actions",
 *       },
 *     };
 *   }
 * }
 * ```
 */
export interface WidgetExtensionInterface extends WidgetMetadataExtensionInterface {
  /**
   * Optional action function.
   * This is a plain app function referenced by `actionFunctionName`.
   */
  action?(ctx: Context, params: WidgetActionInput): Promise<WidgetActionResult>;
}

/**
 * Widget Extension Function Names
 */
export const WidgetFunctionNames = {
  getWidgets: "metadata.getWidgets",
  action: "widget.action",
} as const;
