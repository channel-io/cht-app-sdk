import type { Context } from "../../types/context.js";
import type {
  CommandAutoCompleteArgument as ProtoAutoCompleteArgument,
  CommandExecuteInput as ProtoExecuteCommandInput,
  CommandGetCommandsInput as ProtoGetCommandsInput,
  CommandGetCommandsOutput as ProtoGetCommandsOutput,
  CommandGetSuggestionsInput as ProtoGetSuggestionsInput,
  CommandGetSuggestionsOutput as ProtoGetSuggestionsOutput,
  CommandResult,
  CommandTrigger as ProtoCommandTrigger,
  ExtensionChat as ProtoCommandChat,
} from "../../gen/channel/app/sdk/v1/extension.js";

/**
 * Command metadata input/output types
 */
export type GetCommandsInput = ProtoGetCommandsInput;
export type GetCommandsOutput = ProtoGetCommandsOutput;

/**
 * Command function input/output types
 */
export type CommandChat = ProtoCommandChat;
export type CommandTrigger = ProtoCommandTrigger;
export type AutoCompleteArgument = ProtoAutoCompleteArgument;
export type GetSuggestionsInput = ProtoGetSuggestionsInput;
export type GetSuggestionsOutput = ProtoGetSuggestionsOutput;
export type ExecuteCommandInput = ProtoExecuteCommandInput;

/**
 * Command metadata extension interface
 *
 * Implement this interface to expose command definitions for AppStore registration.
 *
 * @example
 * ```typescript
 * @Extension({ name: "command", systemVersion: "v1" })
 * export class MyCommandExtension implements CommandMetadataExtensionInterface {
 *   @Func("metadata.getCommands")
 *   async getCommands(ctx, params): Promise<GetCommandsOutput> {
 *     return {
 *       commands: [
 *         {
 *           name: "meeting",
 *           scope: "desk",
 *           actionFunctionName: "commands.meeting.execute",
 *           autoCompleteFunctionName: "commands.meeting.autocomplete",
 *           alfMode: "disable",
 *         },
 *       ],
 *     };
 *   }
 * }
 * ```
 */
export interface CommandMetadataExtensionInterface {
  /**
   * Get command definitions for AppStore registration
   *
   * Function name: "metadata.getCommands"
   */
  getCommands(ctx: Context, params: GetCommandsInput): Promise<GetCommandsOutput>;
}

/**
 * Command extension interface
 *
 * Kept intentionally flexible: command metadata is registered via
 * `metadata.getCommands`, while action, autocomplete, or toggle handlers are
 * plain app functions and may live outside the extension class.
 *
 * @example
 * ```typescript
 * @Extension({ name: "command", systemVersion: "v1" })
 * export class MyCommandExtension implements CommandExtensionInterface {
 *   @Func("metadata.getCommands")
 *   async getCommands(ctx, params): Promise<GetCommandsOutput> {
 *     return {
 *       commands: [
 *         {
 *           name: "meeting",
 *           scope: "desk",
 *           actionFunctionName: "commands.meeting.execute",
 *           alfMode: "disable",
 *         },
 *       ],
 *     };
 *   }
 * }
 *
 * export class CommandFunctions {
 *   @Func("commands.meeting.execute")
 *   async execute(ctx, params): Promise<CommandResult> {
 *     return { type: "text", attributes: { message: "Opened meeting flow" } };
 *   }
 * }
 * ```
 */
export interface CommandExtensionInterface extends CommandMetadataExtensionInterface {
  /**
   * Optional autocomplete function.
   * This is a plain app function referenced by `autoCompleteFunctionName`.
   */
  getSuggestions?(ctx: Context, params: GetSuggestionsInput): Promise<GetSuggestionsOutput>;

  /**
   * Optional action function.
   * This is a plain app function referenced by `actionFunctionName`.
   */
  execute?(ctx: Context, params: ExecuteCommandInput): Promise<CommandResult>;
}

/**
 * Command Extension Function Names
 */
export const CommandFunctionNames = {
  getCommands: "metadata.getCommands",
  getSuggestions: "command.getSuggestions",
  execute: "command.execute",
} as const;
