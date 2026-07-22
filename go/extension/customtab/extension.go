package customtab

import (
	"context"

	"github.com/channel-io/app-sdk/go/appsdk"
	extensionkit "github.com/channel-io/app-sdk/go/extension"
	"github.com/channel-io/app-sdk/go/extension/schemaregistry"
	sdkv1 "github.com/channel-io/app-sdk/go/internal/gen/channel/app/sdk/v1"
)

const (
	ExtensionName = "customtab"
	SystemVersion = "v1"

	FunctionGetCustomTabs = "extension.customtab.metadata.getCustomTabs"
	FunctionAction        = "extension.customtab.customtab.action"
)

type ExtensionBuilder struct {
	base *extensionkit.Builder
}

func Extension() *ExtensionBuilder {
	return &ExtensionBuilder{base: extensionkit.New(ExtensionName, extensionkit.SystemVersion(SystemVersion))}
}

func (b *ExtensionBuilder) GetCustomTabs(handler appsdk.TypedHandlerFunc[GetCustomTabsRequest, GetCustomTabsResponse]) *ExtensionBuilder {
	b.base.Func(FunctionGetCustomTabs, schemaregistry.Append(FunctionGetCustomTabs, appsdk.HandleProto(handler))...)
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

func StaticCustomTabs(customTabs ...*Config) appsdk.TypedHandlerFunc[GetCustomTabsRequest, GetCustomTabsResponse] {
	return func(context.Context, appsdk.Context, *GetCustomTabsRequest) (*GetCustomTabsResponse, error) {
		return &GetCustomTabsResponse{CustomTabs: customTabs}, nil
	}
}

type GetCustomTabsRequest = sdkv1.CustomTabGetCustomTabsInput
type GetCustomTabsResponse = sdkv1.CustomTabGetCustomTabsOutput
type Config = sdkv1.CustomTabConfig
type NameI18n = sdkv1.CustomTabNameI18N
type ActionRequest = sdkv1.CustomTabActionInput
type ActionResult = sdkv1.CustomTabActionResult
