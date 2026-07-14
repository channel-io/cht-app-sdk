package testkit

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
)

func Call(t *testing.T, app *appsdk.App, method string, params any) appsdk.FunctionResponse {
	t.Helper()

	body, err := json.Marshal(params)
	if err != nil {
		t.Fatal(err)
	}
	return app.HandleRequest(context.Background(), appsdk.FunctionRequest{
		Method:  method,
		Params:  body,
		Context: appsdk.Context{Channel: appsdk.Channel{ID: "test-channel"}},
	})
}

func Functions(t *testing.T, app *appsdk.App) []appsdk.FunctionSchema {
	t.Helper()
	return discover(t, app, appsdk.MethodGetFunctions)
}

func TestFunctions(t *testing.T, app *appsdk.App) []appsdk.FunctionSchema {
	t.Helper()
	return discover(t, app, appsdk.MethodGetTestFunctions)
}

func discover(t *testing.T, app *appsdk.App, method string) []appsdk.FunctionSchema {
	t.Helper()
	res := app.HandleRequest(context.Background(), appsdk.FunctionRequest{Method: method})
	if res.Error != nil {
		t.Fatalf("unexpected discovery error: %+v", res.Error)
	}
	var result appsdk.GetFunctionsResult
	if err := json.Unmarshal(res.Result, &result); err != nil {
		t.Fatal(err)
	}
	return result.Functions
}
