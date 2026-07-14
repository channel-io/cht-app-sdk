import type { GetAlfTasksResponse } from "../alftask.js";
import type { Context } from "../../types/context.js";
import type { AlfTaskGetTasksInput as ProtoGetAlfTasksInput } from "../../gen/channel/app/sdk/v1/extension.js";

/**
 * ALF Task Extension Input Types
 */
export type GetAlfTasksInput = ProtoGetAlfTasksInput;

/**
 * ALF Task Extension Interface
 *
 * Implement this interface to create ALF (AI Learning Framework) task definitions.
 *
 * @example
 * ```typescript
 * @Extension({ name: "alftask", systemVersion: "v1" })
 * export class MyAlfTaskExtension implements AlfTaskExtensionInterface {
 *   @Func("alftask.getTasks")
 *   async getTasks(ctx, params): Promise<GetAlfTasksResponse> {
 *     return {
 *       predefinedTasks: [
 *         {
 *           version: "v1.0.0",
 *           name: "Auto-categorize ticket",
 *           trigger: "on_ticket_created",
 *           memorySchema: [
 *             { name: "category", type: "string", description: "Ticket category" },
 *           ],
 *           nodes: [
 *             { id: "classify", type: "ai_classify", next: "save" },
 *             { id: "save", type: "save_result" },
 *           ],
 *           startNodeId: "classify",
 *         },
 *       ],
 *     };
 *   }
 * }
 * ```
 */
export interface AlfTaskExtensionInterface {
  /**
   * Get predefined ALF tasks
   *
   * Function name: "alftask.getTasks"
   *
   * @returns List of predefined task configurations
   */
  getTasks(ctx: Context, params: GetAlfTasksInput): Promise<GetAlfTasksResponse>;
}

/**
 * ALF Task Extension Function Names
 */
export const AlfTaskFunctionNames = {
  getTasks: "alftask.getTasks",
} as const;
