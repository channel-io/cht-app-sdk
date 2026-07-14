package legacy_test

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
	"github.com/channel-io/cht-app-sdk/go/compat/legacy"
)

type sdkInput struct {
	Value string `json:"value"`
}

type sdkOutput struct {
	Value string `json:"value"`
}

func TestCompositeRoutesSDKAndLegacyFunctions(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app"})
	app.Func(
		"extension.sdk.echo",
		appsdk.Input[sdkInput](),
		appsdk.Output[sdkOutput](),
		appsdk.Handle(func(_ context.Context, _ appsdk.Context, in *sdkInput) (*sdkOutput, error) {
			return &sdkOutput{Value: in.Value}, nil
		}),
	)
	app.TestFunc(
		"extension.sdk.test",
		appsdk.RawHandler(func(context.Context, appsdk.Context, json.RawMessage) (json.RawMessage, error) {
			return json.RawMessage(`{}`), nil
		}),
	)

	composite, err := legacy.NewComposite(app, legacy.Registry{
		"extension.legacy.echo": func(_ context.Context, params json.RawMessage, _ appsdk.Context) (json.RawMessage, error) {
			return params, nil
		},
	}, func() ([]appsdk.FunctionSchema, error) {
		return []appsdk.FunctionSchema{{
			Name:        "extension.legacy.echo",
			InputSchema: map[string]any{"type": "object"},
		}}, nil
	})
	if err != nil {
		t.Fatal(err)
	}

	sdkRes := composite.HandleRequest(context.Background(), appsdk.FunctionRequest{
		Method: "extension.sdk.echo",
		Params: json.RawMessage(`{"value":"sdk"}`),
	})
	if sdkRes.Error != nil {
		t.Fatalf("unexpected sdk error: %+v", sdkRes.Error)
	}
	var sdkOut sdkOutput
	if err := json.Unmarshal(sdkRes.Result, &sdkOut); err != nil {
		t.Fatal(err)
	}
	if sdkOut.Value != "sdk" {
		t.Fatalf("unexpected sdk response: %s", sdkOut.Value)
	}

	legacyRes := composite.HandleRequest(context.Background(), appsdk.FunctionRequest{
		Method: "extension.legacy.echo",
		Params: json.RawMessage(`{"value":"legacy"}`),
	})
	if legacyRes.Error != nil {
		t.Fatalf("unexpected legacy error: %+v", legacyRes.Error)
	}
	if string(legacyRes.Result) != `{"value":"legacy"}` {
		t.Fatalf("unexpected legacy response: %s", legacyRes.Result)
	}

	functionsRes := composite.HandleRequest(context.Background(), appsdk.FunctionRequest{
		Method: appsdk.MethodGetFunctions,
	})
	if functionsRes.Error != nil {
		t.Fatalf("unexpected getFunctions error: %+v", functionsRes.Error)
	}
	var functions appsdk.GetFunctionsResult
	if err := json.Unmarshal(functionsRes.Result, &functions); err != nil {
		t.Fatal(err)
	}
	if len(functions.Functions) != 2 {
		t.Fatalf("expected 2 functions, got %d", len(functions.Functions))
	}
	for _, fn := range functions.Functions {
		if fn.Name == "extension.sdk.test" {
			t.Fatalf("test function leaked into public discovery: %+v", functions.Functions)
		}
	}

	testFunctionsRes := composite.HandleRequest(context.Background(), appsdk.FunctionRequest{
		Method: appsdk.MethodGetTestFunctions,
	})
	if testFunctionsRes.Error != nil {
		t.Fatalf("unexpected getTestFunctions error: %+v", testFunctionsRes.Error)
	}
	var testFunctions appsdk.GetFunctionsResult
	if err := json.Unmarshal(testFunctionsRes.Result, &testFunctions); err != nil {
		t.Fatal(err)
	}
	if len(testFunctions.Functions) != 1 || testFunctions.Functions[0].Name != "extension.sdk.test" {
		t.Fatalf("unexpected test functions: %+v", testFunctions.Functions)
	}
}

func TestCompositeRejectsDuplicateOwners(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app"})
	app.Func(
		"extension.duplicate",
		appsdk.RawHandler(func(context.Context, appsdk.Context, json.RawMessage) (json.RawMessage, error) {
			return json.RawMessage(`{}`), nil
		}),
	)

	_, err := legacy.NewComposite(app, legacy.Registry{
		"extension.duplicate": func(context.Context, json.RawMessage, appsdk.Context) (json.RawMessage, error) {
			return json.RawMessage(`{}`), nil
		},
	}, nil)
	if err == nil {
		t.Fatal("expected duplicate owner error")
	}
}
