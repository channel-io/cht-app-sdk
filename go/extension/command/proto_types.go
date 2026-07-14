package command

import sdkv1 "github.com/channel-io/cht-app-sdk/go/internal/gen/channel/app/sdk/v1"

type ProtoChat = sdkv1.ExtensionChat
type ProtoActionResult = sdkv1.CommandResult
type ProtoNameI18n = sdkv1.CommandNameI18N
type ProtoNameDescI18n = sdkv1.CommandNameDescI18N
type ProtoParamDefI18n = sdkv1.CommandParamDefI18N
type ProtoChoice = sdkv1.CommandChoice
type ProtoParamDefinition = sdkv1.CommandParamDefinition
type ProtoConfig = sdkv1.CommandConfig
type ProtoGetCommandsRequest = sdkv1.CommandGetCommandsInput
type ProtoGetCommandsResponse = sdkv1.CommandGetCommandsOutput
type ProtoTrigger = sdkv1.CommandTrigger
type ProtoAutoCompleteArgument = sdkv1.CommandAutoCompleteArgument
type ProtoGetSuggestionsRequest = sdkv1.CommandGetSuggestionsInput
type ProtoGetSuggestionsResponse = sdkv1.CommandGetSuggestionsOutput
type ProtoExecuteRequest = sdkv1.CommandExecuteInput
