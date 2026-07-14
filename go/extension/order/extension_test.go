package order_test

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
	"github.com/channel-io/cht-app-sdk/go/extension/order"
)

func TestExtensionRegistersOrderFunctions(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app"})
	if err := app.Use(order.Extension().
		GetOrders(func(_ context.Context, _ appsdk.Context, input *order.GetOrdersInput) (*order.GetOrdersOutput, error) {
			if input.GetIdentifierType() != "orderId" || input.GetIdentifierValue() != "order-1" {
				t.Fatalf("unexpected input: %+v", input)
			}
			return &order.GetOrdersOutput{
				Orders: []*order.Order{{
					Id:    "order-1",
					Title: "Order 1",
				}},
			}, nil
		}).
		GetAppConfigs(order.StaticAppConfigs(&order.AppCapabilities{})),
	); err != nil {
		t.Fatal(err)
	}

	methods := app.Methods()
	if len(methods) != 2 {
		t.Fatalf("expected 2 methods, got %d", len(methods))
	}
	if methods[0] != order.FunctionGetOrders || methods[1] != order.FunctionGetAppConfigs {
		t.Fatalf("unexpected methods: %v", methods)
	}
	targets := app.AutoRegisterTargets()
	if len(targets) != 1 || targets[0].Name != order.ExtensionName || targets[0].SystemVersion != order.SystemVersion {
		t.Fatalf("unexpected auto-register targets: %+v", targets)
	}

	res := app.HandleRequest(context.Background(), appsdk.FunctionRequest{
		Method: order.FunctionGetOrders,
		Params: json.RawMessage(`{"identifierType":"orderId","identifierValue":"order-1"}`),
	})
	if res.Error != nil {
		t.Fatalf("unexpected error: %+v", res.Error)
	}
	var out map[string]any
	if err := json.Unmarshal(res.Result, &out); err != nil {
		t.Fatal(err)
	}
	orders := out["orders"].([]any)
	first := orders[0].(map[string]any)
	if first["id"] != "order-1" {
		t.Fatalf("unexpected output: %+v", out)
	}
}

func TestOrderSchemasUseProtoJSONNames(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app"})
	if err := app.Use(order.Extension().
		ChangeShippingAddress(func(context.Context, appsdk.Context, *order.ChangeShippingAddressInput) (*order.SuccessOutput, error) {
			return &order.SuccessOutput{Success: true}, nil
		}),
	); err != nil {
		t.Fatal(err)
	}

	schemas := app.Schemas()
	properties := schemas[0].InputSchema["properties"].(map[string]any)
	if _, ok := properties["orderId"]; !ok {
		t.Fatalf("expected orderId in schema properties: %#v", properties)
	}
	if _, ok := properties["newAddress"]; !ok {
		t.Fatalf("expected newAddress in schema properties: %#v", properties)
	}
}
