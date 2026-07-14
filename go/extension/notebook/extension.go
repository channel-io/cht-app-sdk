package notebook

import (
	"context"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
	extensionkit "github.com/channel-io/cht-app-sdk/go/extension"
	"github.com/channel-io/cht-app-sdk/go/extension/schemaregistry"
	sdkv1 "github.com/channel-io/cht-app-sdk/go/internal/gen/channel/app/sdk/v1"
)

const (
	ExtensionName = "notebook"
	SystemVersion = "v1"

	FunctionGetNotebooks = "extension.notebook.core.getNotebooks"
)

type ExtensionBuilder struct {
	base *extensionkit.Builder
}

func Extension() *ExtensionBuilder {
	return &ExtensionBuilder{base: extensionkit.New(ExtensionName, extensionkit.SystemVersion(SystemVersion))}
}

func (b *ExtensionBuilder) GetNotebooks(handler appsdk.TypedHandlerFunc[GetNotebooksRequest, GetNotebooksResponse]) *ExtensionBuilder {
	b.base.Func(FunctionGetNotebooks, schemaregistry.Append(FunctionGetNotebooks, appsdk.HandleProto(handler))...)
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

func StaticNotebooks(notebooks ...*AppNotebook) appsdk.TypedHandlerFunc[GetNotebooksRequest, GetNotebooksResponse] {
	return func(context.Context, appsdk.Context, *GetNotebooksRequest) (*GetNotebooksResponse, error) {
		return &GetNotebooksResponse{Notebooks: notebooks}, nil
	}
}

type GetNotebooksRequest = sdkv1.NotebookGetNotebooksInput
type GetNotebooksResponse = sdkv1.NotebookGetNotebooksOutput
type AppNotebook = sdkv1.AppNotebook
type Payload = sdkv1.NotebookPayload
type Cell = sdkv1.NotebookCell
type Tab = sdkv1.NotebookTab
type LayoutRow = sdkv1.NotebookLayoutRow
type LayoutColumn = sdkv1.NotebookLayoutColumn
