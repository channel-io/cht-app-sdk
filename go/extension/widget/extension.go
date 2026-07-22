package widget

import (
	"context"

	"github.com/channel-io/app-sdk/go/appsdk"
	extensionkit "github.com/channel-io/app-sdk/go/extension"
	"github.com/channel-io/app-sdk/go/extension/schemaregistry"
	sdkv1 "github.com/channel-io/app-sdk/go/internal/gen/channel/app/sdk/v1"
)

const (
	ExtensionName = "widget"
	SystemVersion = "v1"

	FunctionGetWidgets = "extension.widget.metadata.getWidgets"
	FunctionAction     = "extension.widget.widget.action"

	ScopeFront = "front"
	ScopeDesk  = "desk"

	TypeWAM     = "wam"
	TypeSnippet = "snippet"
)

type ExtensionBuilder struct {
	base *extensionkit.Builder
}

func Extension() *ExtensionBuilder {
	return &ExtensionBuilder{base: extensionkit.New(ExtensionName, extensionkit.SystemVersion(SystemVersion))}
}

func (b *ExtensionBuilder) GetWidgets(handler appsdk.TypedHandlerFunc[GetWidgetsRequest, GetWidgetsResponse]) *ExtensionBuilder {
	b.base.Func(FunctionGetWidgets, schemaregistry.Append(FunctionGetWidgets, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) Action(name string, handler appsdk.TypedHandlerFunc[ActionRequest, ActionResult]) *ExtensionBuilder {
	b.base.Func(name, schemaregistry.Append(FunctionAction, appsdk.HandleProto(handler))...)
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

func StaticWidgets(widgets ...*Config) appsdk.TypedHandlerFunc[GetWidgetsRequest, GetWidgetsResponse] {
	return func(context.Context, appsdk.Context, *GetWidgetsRequest) (*GetWidgetsResponse, error) {
		return &GetWidgetsResponse{Widgets: widgets}, nil
	}
}

type GetWidgetsRequest = sdkv1.WidgetGetWidgetsInput
type GetWidgetsResponse = sdkv1.WidgetGetWidgetsOutput
type Config = sdkv1.WidgetConfig
type NameDescI18n = sdkv1.WidgetNameDescI18N
type ActionRequest = sdkv1.WidgetActionInput
type Chat = sdkv1.ExtensionChat
type ActionResult = sdkv1.WidgetActionResult
