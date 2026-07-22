package extension_test

import (
	"context"
	"testing"

	"github.com/channel-io/app-sdk/go/appsdk"
	"github.com/channel-io/app-sdk/go/extension"
)

type echoInput struct {
	Message string `json:"message"`
}

type echoOutput struct {
	Message string `json:"message"`
}

func TestBuilderDeclaresExtensionAndRegistersFunctions(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app"})
	builder := extension.New("sample").
		ExtensionFunc("metadata.getSample", appsdk.Input[extension.Empty](), appsdk.Output[echoOutput](), appsdk.Handle(extension.Static(echoOutput{Message: "ok"}))).
		Func("sample.echo", appsdk.Input[echoInput](), appsdk.Output[echoOutput](), appsdk.Handle(func(_ context.Context, _ appsdk.Context, in *echoInput) (*echoOutput, error) {
			return &echoOutput{Message: in.Message}, nil
		}))

	if err := app.Use(builder); err != nil {
		t.Fatal(err)
	}

	if !app.HasMethod("extension.sample.metadata.getSample") {
		t.Fatal("expected extension function to be registered with full name")
	}
	if !app.HasMethod("sample.echo") {
		t.Fatal("expected plain app function to be registered as-is")
	}

	targets := app.AutoRegisterTargets()
	if len(targets) != 1 || targets[0].Name != "sample" || targets[0].SystemVersion != appsdk.DefaultSystemVersion {
		t.Fatalf("unexpected auto register targets: %+v", targets)
	}
}
