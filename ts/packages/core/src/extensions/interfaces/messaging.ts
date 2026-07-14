import type { Context } from "../../types/context.js";
import type {
  InboxGetCustomEditorWamInput,
  InboxGetCustomEditorWamOutput,
  InboxGetMediumMessageErrorReasonInput,
  InboxGetMediumMessageErrorReasonOutput,
  InboxGetMediumTopicSelectorWamInput,
  InboxGetMediumTopicSelectorWamOutput,
  InboxGetWritingTypesInput,
  InboxGetWritingTypesOutput,
  InboxOnMediumUserChatClosedInput,
  InboxOnMediumUserChatClosedOutput,
  OnMediumMessageCreatedInput,
  OnMediumMessageCreatedOutput,
  PrebuiltBuildMediumTopicsInput,
  PrebuiltBuildMediumTopicsOutput,
  PrebuiltGetCustomEditorWamInput,
  PrebuiltGetCustomEditorWamOutput,
  PrebuiltGetDefaultOptionsInput,
  PrebuiltGetDefaultOptionsOutput,
  PrebuiltGetMediumTopicBuilderSelectorWamInput,
  PrebuiltGetMediumTopicBuilderSelectorWamOutput,
  PrebuiltGetWritingTypesInput,
  PrebuiltGetWritingTypesOutput,
  PrebuiltValidateEntityInput,
  PrebuiltValidateEntityOutput,
} from "../messaging.js";

export const MessagingFunctionNames = {
  inbox: {
    onMediumMessageCreated: "inbox.onMediumMessageCreated",
    onMediumUserChatClosed: "inbox.onMediumUserChatClosed",
    getWritingTypes: "inbox.getWritingTypes",
    getCustomEditorWam: "inbox.getCustomEditorWam",
    getMediumTopicSelectorWam: "inbox.getMediumTopicSelectorWam",
    getMediumMessageErrorReason: "inbox.getMediumMessageErrorReason",
  },
  prebuilt: {
    getWritingTypes: "prebuilt.getWritingTypes",
    validateEntity: "prebuilt.validateEntity",
    getCustomEditorWam: "prebuilt.getCustomEditorWam",
    getMediumTopicBuilderSelectorWam: "prebuilt.getMediumTopicBuilderSelectorWam",
    buildMediumTopics: "prebuilt.buildMediumTopics",
    getDefaultOptions: "prebuilt.getDefaultOptions",
  },
} as const;

export interface MessagingInboxExtensionInterface {
  onMediumMessageCreated(
    ctx: Context,
    params: OnMediumMessageCreatedInput
  ): Promise<OnMediumMessageCreatedOutput>;

  onMediumUserChatClosed?(
    ctx: Context,
    params: InboxOnMediumUserChatClosedInput
  ): Promise<InboxOnMediumUserChatClosedOutput>;

  getWritingTypes?(
    ctx: Context,
    params: InboxGetWritingTypesInput
  ): Promise<InboxGetWritingTypesOutput>;

  getCustomEditorWam?(
    ctx: Context,
    params: InboxGetCustomEditorWamInput
  ): Promise<InboxGetCustomEditorWamOutput>;

  getMediumTopicSelectorWam?(
    ctx: Context,
    params: InboxGetMediumTopicSelectorWamInput
  ): Promise<InboxGetMediumTopicSelectorWamOutput>;

  getMediumMessageErrorReason?(
    ctx: Context,
    params: InboxGetMediumMessageErrorReasonInput
  ): Promise<InboxGetMediumMessageErrorReasonOutput>;
}

export interface MessagingPrebuiltExtensionInterface {
  getWritingTypes?(
    ctx: Context,
    params: PrebuiltGetWritingTypesInput
  ): Promise<PrebuiltGetWritingTypesOutput>;

  validateEntity?(
    ctx: Context,
    params: PrebuiltValidateEntityInput
  ): Promise<PrebuiltValidateEntityOutput>;

  getCustomEditorWam?(
    ctx: Context,
    params: PrebuiltGetCustomEditorWamInput
  ): Promise<PrebuiltGetCustomEditorWamOutput>;

  getMediumTopicBuilderSelectorWam?(
    ctx: Context,
    params: PrebuiltGetMediumTopicBuilderSelectorWamInput
  ): Promise<PrebuiltGetMediumTopicBuilderSelectorWamOutput>;

  buildMediumTopics?(
    ctx: Context,
    params: PrebuiltBuildMediumTopicsInput
  ): Promise<PrebuiltBuildMediumTopicsOutput>;

  getDefaultOptions?(
    ctx: Context,
    params: PrebuiltGetDefaultOptionsInput
  ): Promise<PrebuiltGetDefaultOptionsOutput>;
}

export type MessagingExtensionInterface = MessagingInboxExtensionInterface &
  MessagingPrebuiltExtensionInterface;
