package mailrelay

import (
	"github.com/channel-io/cht-app-sdk/go/appsdk"
	extensionkit "github.com/channel-io/cht-app-sdk/go/extension"
	"github.com/channel-io/cht-app-sdk/go/extension/schemaregistry"
)

const (
	ExtensionName = "mailRelay"
	SystemVersion = "v1"

	FunctionOnMailReceived = "extension.mailRelay.inbound.onMailReceived"
)

type ExtensionBuilder struct {
	base *extensionkit.Builder
}

func Extension() *ExtensionBuilder {
	return &ExtensionBuilder{base: extensionkit.New(ExtensionName, extensionkit.SystemVersion(SystemVersion))}
}

func (b *ExtensionBuilder) OnMailReceived(handler appsdk.TypedHandlerFunc[InboundInput, InboundOutput]) *ExtensionBuilder {
	b.base.Func(FunctionOnMailReceived, schemaregistry.Append(FunctionOnMailReceived, appsdk.HandleProto(handler))...)
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
