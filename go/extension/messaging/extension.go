package messaging

import (
	"github.com/channel-io/cht-app-sdk/go/appsdk"
	extensionkit "github.com/channel-io/cht-app-sdk/go/extension"
	"github.com/channel-io/cht-app-sdk/go/extension/schemaregistry"
)

const (
	ExtensionName = "messaging"
	SystemVersion = "v1"

	FunctionInboxOnMediumMessageCreated      = "extension.messaging.inbox.onMediumMessageCreated"
	FunctionInboxOnMediumUserChatClosed      = "extension.messaging.inbox.onMediumUserChatClosed"
	FunctionInboxGetWritingTypes             = "extension.messaging.inbox.getWritingTypes"
	FunctionInboxGetCustomEditorWAM          = "extension.messaging.inbox.getCustomEditorWam"
	FunctionInboxGetMediumTopicSelectorWAM   = "extension.messaging.inbox.getMediumTopicSelectorWam"
	FunctionInboxGetMediumMessageErrorReason = "extension.messaging.inbox.getMediumMessageErrorReason"
	FunctionPrebuiltGetWritingTypes          = "extension.messaging.prebuilt.getWritingTypes"
	FunctionPrebuiltValidateEntity           = "extension.messaging.prebuilt.validateEntity"
	FunctionPrebuiltGetCustomEditorWAM       = "extension.messaging.prebuilt.getCustomEditorWam"
	FunctionPrebuiltGetMediumTopicBuilderWAM = "extension.messaging.prebuilt.getMediumTopicBuilderSelectorWam"
	FunctionPrebuiltBuildMediumTopics        = "extension.messaging.prebuilt.buildMediumTopics"
	FunctionPrebuiltGetDefaultOptions        = "extension.messaging.prebuilt.getDefaultOptions"
)

type ExtensionBuilder struct {
	base *extensionkit.Builder
}

func Extension() *ExtensionBuilder {
	return &ExtensionBuilder{base: extensionkit.New(ExtensionName, extensionkit.SystemVersion(SystemVersion))}
}

func (b *ExtensionBuilder) InboxOnMediumMessageCreated(handler appsdk.TypedHandlerFunc[OnMediumMessageCreatedInput, OnMediumMessageCreatedOutput]) *ExtensionBuilder {
	b.base.Func(FunctionInboxOnMediumMessageCreated, schemaregistry.Append(FunctionInboxOnMediumMessageCreated, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) InboxOnMediumUserChatClosed(handler appsdk.TypedHandlerFunc[InboxOnMediumUserChatClosedInput, InboxOnMediumUserChatClosedOutput]) *ExtensionBuilder {
	b.base.Func(FunctionInboxOnMediumUserChatClosed, schemaregistry.Append(FunctionInboxOnMediumUserChatClosed, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) InboxGetWritingTypes(handler appsdk.TypedHandlerFunc[InboxGetWritingTypesInput, InboxGetWritingTypesOutput]) *ExtensionBuilder {
	b.base.Func(FunctionInboxGetWritingTypes, schemaregistry.Append(FunctionInboxGetWritingTypes, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) InboxGetCustomEditorWAM(handler appsdk.TypedHandlerFunc[InboxGetCustomEditorWAMInput, WAMResult]) *ExtensionBuilder {
	b.base.Func(FunctionInboxGetCustomEditorWAM, schemaregistry.Append(FunctionInboxGetCustomEditorWAM, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) InboxGetMediumTopicSelectorWAM(handler appsdk.TypedHandlerFunc[InboxGetMediumTopicSelectorWAMInput, WAMResult]) *ExtensionBuilder {
	b.base.Func(FunctionInboxGetMediumTopicSelectorWAM, schemaregistry.Append(FunctionInboxGetMediumTopicSelectorWAM, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) InboxGetMediumMessageErrorReason(handler appsdk.TypedHandlerFunc[InboxGetMediumMessageErrorReasonInput, InboxGetMediumMessageErrorReasonOutput]) *ExtensionBuilder {
	b.base.Func(FunctionInboxGetMediumMessageErrorReason, schemaregistry.Append(FunctionInboxGetMediumMessageErrorReason, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) PrebuiltGetWritingTypes(handler appsdk.TypedHandlerFunc[PrebuiltGetWritingTypesInput, PrebuiltGetWritingTypesOutput]) *ExtensionBuilder {
	b.base.Func(FunctionPrebuiltGetWritingTypes, schemaregistry.Append(FunctionPrebuiltGetWritingTypes, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) PrebuiltValidateEntity(handler appsdk.TypedHandlerFunc[PrebuiltValidateEntityInput, PrebuiltValidateEntityOutput]) *ExtensionBuilder {
	b.base.Func(FunctionPrebuiltValidateEntity, schemaregistry.Append(FunctionPrebuiltValidateEntity, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) PrebuiltGetCustomEditorWAM(handler appsdk.TypedHandlerFunc[PrebuiltGetCustomEditorWAMInput, WAMResult]) *ExtensionBuilder {
	b.base.Func(FunctionPrebuiltGetCustomEditorWAM, schemaregistry.Append(FunctionPrebuiltGetCustomEditorWAM, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) PrebuiltGetMediumTopicBuilderSelectorWAM(handler appsdk.TypedHandlerFunc[PrebuiltGetMediumTopicBuilderSelectorWAMInput, WAMResult]) *ExtensionBuilder {
	b.base.Func(FunctionPrebuiltGetMediumTopicBuilderWAM, schemaregistry.Append(FunctionPrebuiltGetMediumTopicBuilderWAM, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) PrebuiltBuildMediumTopics(handler appsdk.TypedHandlerFunc[PrebuiltBuildMediumTopicsInput, PrebuiltBuildMediumTopicsOutput]) *ExtensionBuilder {
	b.base.Func(FunctionPrebuiltBuildMediumTopics, schemaregistry.Append(FunctionPrebuiltBuildMediumTopics, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) PrebuiltGetDefaultOptions(handler appsdk.TypedHandlerFunc[PrebuiltGetDefaultOptionsInput, PrebuiltGetDefaultOptionsOutput]) *ExtensionBuilder {
	b.base.Func(FunctionPrebuiltGetDefaultOptions, schemaregistry.Append(FunctionPrebuiltGetDefaultOptions, appsdk.HandleProto(handler))...)
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
