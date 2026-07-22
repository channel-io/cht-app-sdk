package config_test

import (
	"context"
	"testing"

	"github.com/channel-io/app-sdk/go/appsdk"
	"github.com/channel-io/app-sdk/go/extension/config"
	"google.golang.org/protobuf/encoding/protojson"
)

func TestExtensionRegistersConfigSchema(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app"})
	if err := app.Use(config.Extension().
		GetConfigSchema(config.StaticSchema(&config.GetConfigSchemaResponse{
			SchemaVersion: "v1",
			ConfigScope:   config.ScopeChannel,
			ProviderName:  "Provider",
			Blocks: []*config.Block{{
				Type:         "text",
				Key:          "storeId",
				Label:        "Store ID",
				Required:     true,
				StorageClass: config.StorageClassConfig,
			}},
		})).
		ValidateStoredConfig(func(context.Context, appsdk.Context, *config.ValidateStoredConfigRequest) (*config.ValidateStoredConfigResponse, error) {
			return config.Valid(), nil
		}),
	); err != nil {
		t.Fatal(err)
	}

	res := app.HandleRequest(context.Background(), appsdk.FunctionRequest{Method: config.FunctionGetConfigSchema})
	if res.Error != nil {
		t.Fatalf("unexpected error: %+v", res.Error)
	}
	var out config.GetConfigSchemaResponse
	if err := protojson.Unmarshal(res.Result, &out); err != nil {
		t.Fatal(err)
	}
	if out.ProviderName != "Provider" || len(out.Blocks) != 1 {
		t.Fatalf("unexpected schema: providerName=%q blocks=%d", out.GetProviderName(), len(out.GetBlocks()))
	}
}

func TestCredentialsFromPrefersConfigStringsOverLegacyAPICredentials(t *testing.T) {
	got := config.CredentialsFrom(appsdk.Context{
		APICredentials: map[string]string{
			"apiKey": "legacy",
			"domain": "legacy-domain",
		},
		Config: map[string]any{
			"domain": "config-domain",
			"count":  1,
		},
	})

	if got["apiKey"] != "legacy" {
		t.Fatalf("expected legacy-only credential to remain, got %#v", got)
	}
	if got["domain"] != "config-domain" {
		t.Fatalf("expected config string to override legacy value, got %#v", got)
	}
	if _, ok := got["count"]; ok {
		t.Fatalf("expected non-string config value to be omitted, got %#v", got)
	}
}
