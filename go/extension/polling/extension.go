package polling

import (
	"context"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
	extensionkit "github.com/channel-io/cht-app-sdk/go/extension"
	"github.com/channel-io/cht-app-sdk/go/extension/schemaregistry"
	sdkv1 "github.com/channel-io/cht-app-sdk/go/internal/gen/channel/app/sdk/v1"
)

const (
	ExtensionName = "polling"
	SystemVersion = "v1"

	FunctionGetPollers  = "extension.polling.metadata.getPollers"
	FunctionGetChannels = "extension.polling.target.getChannels"
)

type ExtensionBuilder struct {
	base *extensionkit.Builder
}

func Extension() *ExtensionBuilder {
	return &ExtensionBuilder{base: extensionkit.New(ExtensionName, extensionkit.SystemVersion(SystemVersion))}
}

func (b *ExtensionBuilder) GetPollers(handler appsdk.TypedHandlerFunc[GetPollersRequest, GetPollersResponse]) *ExtensionBuilder {
	b.base.Func(FunctionGetPollers, schemaregistry.Append(FunctionGetPollers, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) GetChannels(handler appsdk.TypedHandlerFunc[GetChannelsRequest, GetChannelsResponse]) *ExtensionBuilder {
	b.base.Func(FunctionGetChannels, schemaregistry.Append(FunctionGetChannels, appsdk.HandleProto(handler))...)
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

func StaticPollers(pollers ...*Poller) appsdk.TypedHandlerFunc[GetPollersRequest, GetPollersResponse] {
	return func(context.Context, appsdk.Context, *GetPollersRequest) (*GetPollersResponse, error) {
		return &GetPollersResponse{Pollers: pollers}, nil
	}
}

type GetPollersRequest = sdkv1.PollingGetPollersInput
type GetPollersResponse = sdkv1.PollingGetPollersOutput
type Poller = sdkv1.PollingPoller
type GetChannelsRequest = sdkv1.PollingGetTargetChannelsInput
type GetChannelsResponse = sdkv1.PollingGetTargetChannelsOutput
