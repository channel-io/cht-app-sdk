package alftask

import (
	"context"

	"github.com/channel-io/app-sdk/go/appsdk"
	extensionkit "github.com/channel-io/app-sdk/go/extension"
	"github.com/channel-io/app-sdk/go/extension/schemaregistry"
	sdkv1 "github.com/channel-io/app-sdk/go/internal/gen/channel/app/sdk/v1"
)

const (
	ExtensionName = "alfTask"
	SystemVersion = "v1"

	FunctionGetTasks = "extension.alfTask.alftask.getTasks"
)

type ExtensionBuilder struct {
	base *extensionkit.Builder
}

func Extension() *ExtensionBuilder {
	return &ExtensionBuilder{base: extensionkit.New(ExtensionName, extensionkit.SystemVersion(SystemVersion))}
}

func (b *ExtensionBuilder) GetTasks(handler appsdk.TypedHandlerFunc[GetTasksRequest, GetTasksResponse]) *ExtensionBuilder {
	b.base.Func(FunctionGetTasks, schemaregistry.Append(FunctionGetTasks, appsdk.HandleProto(handler))...)
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

func StaticTasks(tasks ...*PredefinedTask) appsdk.TypedHandlerFunc[GetTasksRequest, GetTasksResponse] {
	return func(context.Context, appsdk.Context, *GetTasksRequest) (*GetTasksResponse, error) {
		return &GetTasksResponse{PredefinedTasks: tasks}, nil
	}
}

type GetTasksRequest = sdkv1.AlfTaskGetTasksInput
type GetTasksResponse = sdkv1.AlfTaskGetTasksOutput
type PredefinedTask = sdkv1.AlfTaskPredefinedTask
type MemoryDefinition = sdkv1.AlfTaskMemoryDefinition
type WorkflowNode = sdkv1.AlfTaskWorkflowNode
