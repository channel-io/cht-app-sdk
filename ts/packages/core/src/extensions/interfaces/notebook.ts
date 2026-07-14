import type { Context } from "../../types/context.js";
import type { NotebookGetNotebooksInput as ProtoGetNotebooksInput } from "../../gen/channel/app/sdk/v1/extension.js";
import type { GetNotebooksResponse } from "../notebook.js";

export type GetNotebooksInput = ProtoGetNotebooksInput;

export interface NotebookExtensionInterface {
  getNotebooks(ctx: Context, params: GetNotebooksInput): Promise<GetNotebooksResponse>;
}

export const NotebookFunctionNames = {
  getNotebooks: "core.getNotebooks",
} as const;
