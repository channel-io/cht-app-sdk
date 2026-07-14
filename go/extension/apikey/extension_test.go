package apikey_test

import (
	"context"
	"reflect"
	"testing"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
	"github.com/channel-io/cht-app-sdk/go/extension/apikey"
	"github.com/channel-io/cht-app-sdk/go/extension/schemaregistry"
	"google.golang.org/protobuf/encoding/protojson"
)

func TestExtensionRegistersSelectedFunctions(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app"})
	if err := app.Use(apikey.Extension().
		GetAuthConfig(apikey.StaticAuthConfig(&apikey.AuthConfig{
			AuthType:     apikey.AuthTypeAPIKey,
			AuthScope:    apikey.AuthScopeChannel,
			ProviderName: "Provider",
			Fields: []*apikey.Field{{
				Name:        "apiKey",
				DisplayName: "API key",
				Required:    true,
				Sensitive:   true,
			}},
		})).
		ValidateCredentials(func(_ context.Context, fnCtx appsdk.Context, in *apikey.ValidateCredentialsRequest) (*apikey.ValidateCredentialsResponse, error) {
			if apikey.CredentialsFrom(fnCtx, in)["apiKey"] != "secret" {
				return apikey.Invalid("invalid"), nil
			}
			return apikey.Valid(), nil
		}),
	); err != nil {
		t.Fatal(err)
	}

	methods := app.Methods()
	if len(methods) != 2 {
		t.Fatalf("expected 2 methods, got %d", len(methods))
	}
	if methods[0] != apikey.FunctionGetAuthConfig || methods[1] != apikey.FunctionValidateCredentials {
		t.Fatalf("unexpected methods: %v", methods)
	}
	targets := app.AutoRegisterTargets()
	if len(targets) != 1 || targets[0].Name != apikey.ExtensionName || targets[0].SystemVersion != apikey.SystemVersion {
		t.Fatalf("unexpected auto-register targets: %+v", targets)
	}
	schemas := app.Schemas()
	if len(schemas) != 2 {
		t.Fatalf("expected 2 schemas, got %d", len(schemas))
	}
	wantGetAuthConfig, ok := schemaregistry.Schema(apikey.FunctionGetAuthConfig)
	if !ok {
		t.Fatalf("missing canonical schema for %s", apikey.FunctionGetAuthConfig)
	}
	wantValidateCredentials, ok := schemaregistry.Schema(apikey.FunctionValidateCredentials)
	if !ok {
		t.Fatalf("missing canonical schema for %s", apikey.FunctionValidateCredentials)
	}
	if !reflect.DeepEqual(schemas[0], wantGetAuthConfig) || !reflect.DeepEqual(schemas[1], wantValidateCredentials) {
		t.Fatalf("apikey schemas drifted from canonical registry")
	}

	res := app.HandleRequest(context.Background(), appsdk.FunctionRequest{
		Method:  apikey.FunctionValidateCredentials,
		Context: appsdk.Context{APICredentials: map[string]string{"apiKey": "secret"}},
	})
	if res.Error != nil {
		t.Fatalf("unexpected error: %+v", res.Error)
	}
	var out apikey.ValidateCredentialsResponse
	if err := protojson.Unmarshal(res.Result, &out); err != nil {
		t.Fatal(err)
	}
	if !out.Valid {
		t.Fatalf("unexpected response: valid=%v error=%q", out.GetValid(), out.GetErrorMessage())
	}

	res = app.HandleRequest(context.Background(), appsdk.FunctionRequest{
		Method:  apikey.FunctionValidateCredentials,
		Context: appsdk.Context{APICredentials: map[string]string{"apiKey": "secret"}},
	})
	if res.Error != nil {
		t.Fatalf("unexpected context credential error: %+v", res.Error)
	}
}
