package command

import (
	"context"

	"github.com/channel-io/app-sdk/go/appsdk"
	extensionkit "github.com/channel-io/app-sdk/go/extension"
	"github.com/channel-io/app-sdk/go/extension/schemaregistry"
	sdkv1 "github.com/channel-io/app-sdk/go/internal/gen/channel/app/sdk/v1"
)

const (
	ExtensionName = "command"
	SystemVersion = "v1"

	FunctionGetCommands    = "extension.command.metadata.getCommands"
	FunctionGetSuggestions = "extension.command.command.getSuggestions"
	FunctionExecute        = "extension.command.command.execute"

	ScopeFront = "front"
	ScopeDesk  = "desk"

	AlfModeDisable   = "disable"
	AlfModeRecommend = "recommend"
)

type ExtensionBuilder struct {
	base *extensionkit.Builder
}

func Extension() *ExtensionBuilder {
	return &ExtensionBuilder{base: extensionkit.New(ExtensionName, extensionkit.SystemVersion(SystemVersion))}
}

func (b *ExtensionBuilder) GetCommands(handler appsdk.TypedHandlerFunc[GetCommandsRequest, GetCommandsResponse]) *ExtensionBuilder {
	b.base.Func(FunctionGetCommands, schemaregistry.Append(FunctionGetCommands, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) Suggestions(name string, handler appsdk.TypedHandlerFunc[GetSuggestionsRequest, GetSuggestionsResponse]) *ExtensionBuilder {
	b.base.Func(name, schemaregistry.Append(FunctionGetSuggestions, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) Execute(name string, handler appsdk.TypedHandlerFunc[ExecuteRequest, ActionResult]) *ExtensionBuilder {
	b.base.Func(name, schemaregistry.Append(FunctionExecute, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) Function(name string, opts ...appsdk.FunctionOption) *ExtensionBuilder {
	b.base.Func(name, opts...)
	return b
}

func (b *ExtensionBuilder) ExtensionFunction(name string, opts ...appsdk.FunctionOption) *ExtensionBuilder {
	b.base.ExtensionFunc(name, opts...)
	return b
}

func (b *ExtensionBuilder) Register(app *appsdk.App) error {
	return b.base.Register(app)
}

func StaticCommands(commands ...*Config) appsdk.TypedHandlerFunc[GetCommandsRequest, GetCommandsResponse] {
	return func(context.Context, appsdk.Context, *GetCommandsRequest) (*GetCommandsResponse, error) {
		return &GetCommandsResponse{Commands: commands}, nil
	}
}

type GetCommandsRequest = sdkv1.CommandGetCommandsInput
type GetCommandsResponse = sdkv1.CommandGetCommandsOutput
type Config = sdkv1.CommandConfig
type NameI18n = sdkv1.CommandNameI18N
type NameDescI18n = sdkv1.CommandNameDescI18N
type ParamDefinition = sdkv1.CommandParamDefinition
type Choice = sdkv1.CommandChoice
type Chat = sdkv1.ExtensionChat
type Trigger = sdkv1.CommandTrigger
type AutoCompleteArgument = sdkv1.CommandAutoCompleteArgument
type GetSuggestionsRequest = sdkv1.CommandGetSuggestionsInput
type GetSuggestionsResponse = sdkv1.CommandGetSuggestionsOutput
type Suggestion = sdkv1.CommandChoice
type ExecuteRequest = sdkv1.CommandExecuteInput
type ActionResult = sdkv1.CommandResult
