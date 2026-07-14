package commerce

import (
	"context"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
	extensionkit "github.com/channel-io/cht-app-sdk/go/extension"
	"github.com/channel-io/cht-app-sdk/go/extension/schemaregistry"
)

type ExtensionBuilder struct {
	base *extensionkit.Builder
}

func Extension() *ExtensionBuilder {
	return &ExtensionBuilder{base: extensionkit.New(ExtensionName, extensionkit.SystemVersion(SystemVersion))}
}

func (b *ExtensionBuilder) GetAppConfigs(handler appsdk.TypedHandlerFunc[GetAppConfigsInput, GetAppConfigsOutput]) *ExtensionBuilder {
	b.base.Func(FunctionGetAppConfigs, schemaregistry.Append(FunctionGetAppConfigs, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) GetOrders(handler appsdk.TypedHandlerFunc[GetOrdersInput, GetOrdersOutput]) *ExtensionBuilder {
	b.base.Func(FunctionGetOrders, schemaregistry.Append(FunctionGetOrders, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) CancelRequestOrder(handler appsdk.TypedHandlerFunc[CancelOrderInput, ActionResult]) *ExtensionBuilder {
	b.base.Func(FunctionCancelRequestOrder, schemaregistry.Append(FunctionCancelRequestOrder, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) ReturnRequestOrder(handler appsdk.TypedHandlerFunc[ReturnOrderInput, ActionResult]) *ExtensionBuilder {
	b.base.Func(FunctionReturnRequestOrder, schemaregistry.Append(FunctionReturnRequestOrder, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) ReturnAcceptOrder(handler appsdk.TypedHandlerFunc[ReturnAcceptOrderInput, ActionResult]) *ExtensionBuilder {
	b.base.Func(FunctionReturnAcceptOrder, schemaregistry.Append(FunctionReturnAcceptOrder, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) ExchangeRequestOrder(handler appsdk.TypedHandlerFunc[ExchangeOrderInput, ActionResult]) *ExtensionBuilder {
	b.base.Func(FunctionExchangeRequestOrder, schemaregistry.Append(FunctionExchangeRequestOrder, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) GetExchangeableItems(handler appsdk.TypedHandlerFunc[GetExchangeableItemsInput, GetExchangeableItemsOutput]) *ExtensionBuilder {
	b.base.Func(FunctionGetExchangeableItems, schemaregistry.Append(FunctionGetExchangeableItems, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) ChangeShippingAddress(handler appsdk.TypedHandlerFunc[ChangeShippingAddressInput, ActionResult]) *ExtensionBuilder {
	b.base.Func(FunctionChangeShippingAddress, schemaregistry.Append(FunctionChangeShippingAddress, appsdk.HandleProto(handler))...)
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

func StaticAppConfigs(capabilities *AppCapabilities) appsdk.TypedHandlerFunc[GetAppConfigsInput, GetAppConfigsOutput] {
	return func(context.Context, appsdk.Context, *GetAppConfigsInput) (*GetAppConfigsOutput, error) {
		return &GetAppConfigsOutput{AppCapabilities: capabilities}, nil
	}
}
