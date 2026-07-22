package command_test

import (
	"context"
	"testing"

	"github.com/channel-io/app-sdk/go/appsdk"
	"github.com/channel-io/app-sdk/go/extension/command"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestExtensionRegistersMetadataAndAction(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app"})
	if err := app.Use(command.Extension().
		GetCommands(command.StaticCommands(&command.Config{
			Name:               "meeting",
			Scope:              command.ScopeDesk,
			ActionFunctionName: "commands.meeting.execute",
			AlfMode:            command.AlfModeDisable,
			EnabledByDefault:   true,
		})).
		Execute("commands.meeting.execute", func(context.Context, appsdk.Context, *command.ExecuteRequest) (*command.ActionResult, error) {
			attributes, err := structpb.NewStruct(map[string]any{"message": "ok"})
			if err != nil {
				return nil, err
			}
			return &command.ActionResult{Type: "text", Attributes: attributes}, nil
		}),
	); err != nil {
		t.Fatal(err)
	}

	if !app.HasMethod(command.FunctionGetCommands) {
		t.Fatal("expected command metadata function")
	}
	if !app.HasMethod("commands.meeting.execute") {
		t.Fatal("expected command action function")
	}

	res := app.HandleRequest(context.Background(), appsdk.FunctionRequest{Method: command.FunctionGetCommands})
	if res.Error != nil {
		t.Fatalf("unexpected error: %+v", res.Error)
	}
	var out command.GetCommandsResponse
	if err := protojson.Unmarshal(res.Result, &out); err != nil {
		t.Fatal(err)
	}
	if len(out.Commands) != 1 || out.Commands[0].Name != "meeting" {
		t.Fatalf("unexpected commands: %+v", out.Commands)
	}
}

func TestExtensionFunctionAcceptsRelativeNames(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app"})
	if err := app.Use(command.Extension().
		ExtensionFunction(
			"command.execute",
			appsdk.ProtoHandler(func(context.Context, appsdk.Context, *command.ExecuteRequest) (*command.ActionResult, error) {
				return &command.ActionResult{Type: "text"}, nil
			})...,
		),
	); err != nil {
		t.Fatal(err)
	}

	if !app.HasMethod(command.FunctionExecute) {
		t.Fatalf("expected relative extension function to register as %s, got %v", command.FunctionExecute, app.Methods())
	}
}
