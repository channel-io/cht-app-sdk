package schema

import (
	"testing"

	sdkv1 "github.com/channel-io/cht-app-sdk/go/internal/gen/channel/app/sdk/v1"
	"google.golang.org/protobuf/types/known/anypb"
	"google.golang.org/protobuf/types/known/durationpb"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

type EmbeddedSchema struct {
	ID string `json:"id" schema:"description=Identifier"`
}

type outerSchema struct {
	EmbeddedSchema
	Name     string            `json:"name" schema:"description=Display name"`
	Status   string            `json:"status,omitempty" schema:"enum=open|closed"`
	Metadata map[string]string `json:"metadata,omitempty"`
	Raw      map[string]any    `json:"raw,omitempty"`
}

type recursiveSchema struct {
	Name     string            `json:"name"`
	Children []recursiveSchema `json:"children,omitempty"`
}

func TestFromTypeFlattensEmbeddedStructAndAppliesTags(t *testing.T) {
	got := For[outerSchema]()

	properties := got["properties"].(map[string]any)
	if _, ok := properties["embeddedSchema"]; ok {
		t.Fatal("expected anonymous embedded struct to be flattened")
	}
	if _, ok := properties["id"]; !ok {
		t.Fatal("expected embedded field id")
	}

	name := properties["name"].(map[string]any)
	if name["description"] != "Display name" {
		t.Fatalf("expected description tag, got %#v", name["description"])
	}

	status := properties["status"].(map[string]any)
	enum := status["enum"].([]string)
	if len(enum) != 2 || enum[0] != "open" || enum[1] != "closed" {
		t.Fatalf("expected enum tag, got %#v", enum)
	}

	required := got["required"].([]string)
	if !contains(required, "id") || !contains(required, "name") {
		t.Fatalf("expected id and name to be required, got %#v", required)
	}
	if contains(required, "status") {
		t.Fatalf("expected omitempty field not to be required, got %#v", required)
	}
}

func TestFromTypeDescribesMapValues(t *testing.T) {
	got := For[outerSchema]()
	properties := got["properties"].(map[string]any)

	metadata := properties["metadata"].(map[string]any)
	additional := metadata["additionalProperties"].(map[string]any)
	if additional["type"] != "string" {
		t.Fatalf("expected string map values, got %#v", additional)
	}

	raw := properties["raw"].(map[string]any)
	if _, ok := raw["additionalProperties"].(map[string]any); !ok {
		t.Fatalf("expected map[string]any to expose open additional properties, got %#v", raw["additionalProperties"])
	}
}

func TestFromTypeHandlesRecursiveStructs(t *testing.T) {
	got := For[recursiveSchema]()
	properties := got["properties"].(map[string]any)
	children := properties["children"].(map[string]any)
	items := children["items"].(map[string]any)
	if items["type"] != "object" {
		t.Fatalf("expected recursive item to be cut as object, got %#v", items)
	}
}

func TestFromTypeDescribesProtoMessagesWithJSONNames(t *testing.T) {
	got := For[sdkv1.WmsGetOrderRequest]()
	properties := got["properties"].(map[string]any)

	for _, name := range []string{"commerceOrderId", "orderId", "packageId", "shopId"} {
		property, ok := properties[name].(map[string]any)
		if !ok {
			t.Fatalf("expected proto JSON field %q in %#v", name, properties)
		}
		if property["type"] != "string" {
			t.Fatalf("expected %s to be string, got %#v", name, property)
		}
	}
	if _, ok := got["required"]; ok {
		t.Fatalf("expected proto3 fields not to be marked required, got %#v", got["required"])
	}
}

func TestFromTypeDescribesProtoJSONWellKnownTypes(t *testing.T) {
	timestamp := For[timestamppb.Timestamp]()
	if timestamp["type"] != "string" || timestamp["format"] != "date-time" {
		t.Fatalf("expected timestamp date-time string, got %#v", timestamp)
	}

	duration := For[durationpb.Duration]()
	if duration["type"] != "string" {
		t.Fatalf("expected duration string, got %#v", duration)
	}

	anySchema := For[anypb.Any]()
	properties := anySchema["properties"].(map[string]any)
	if properties["@type"].(map[string]any)["type"] != "string" {
		t.Fatalf("expected Any @type string, got %#v", anySchema)
	}
	if anySchema["additionalProperties"] != true {
		t.Fatalf("expected Any to allow embedded fields, got %#v", anySchema)
	}

	empty := For[emptypb.Empty]()
	if empty["type"] != "object" {
		t.Fatalf("expected Empty object, got %#v", empty)
	}

	int64Wrapper := For[wrapperspb.Int64Value]()
	if int64Wrapper["type"] != "string" {
		t.Fatalf("expected Int64Value string, got %#v", int64Wrapper)
	}

	boolWrapper := For[wrapperspb.BoolValue]()
	if boolWrapper["type"] != "boolean" {
		t.Fatalf("expected BoolValue boolean, got %#v", boolWrapper)
	}
}

func TestExtendObjectAtAddsNestedArrayItemProperty(t *testing.T) {
	base := map[string]any{
		"type": "object",
		"properties": map[string]any{
			"orders": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"id": map[string]any{"type": "string"},
					},
					"additionalProperties": false,
				},
			},
		},
	}

	got, err := Apply(base, ExtendObjectAt("orders[]", Property("shopId", map[string]any{"type": "string"}, Required())))
	if err != nil {
		t.Fatal(err)
	}

	orders := got["properties"].(map[string]any)["orders"].(map[string]any)
	item := orders["items"].(map[string]any)
	properties := item["properties"].(map[string]any)
	if properties["shopId"].(map[string]any)["type"] != "string" {
		t.Fatalf("expected nested shopId property, got %#v", properties)
	}
	if item["additionalProperties"] != false {
		t.Fatalf("expected nested additionalProperties to stay unchanged, got %#v", item)
	}
	required := item["required"].([]string)
	if !contains(required, "shopId") {
		t.Fatalf("expected shopId to be required, got %#v", required)
	}
	if _, exists := base["properties"].(map[string]any)["orders"].(map[string]any)["items"].(map[string]any)["required"]; exists {
		t.Fatal("expected base schema not to be mutated")
	}
}

func TestExtendObjectRejectsExistingProperty(t *testing.T) {
	base := map[string]any{
		"type": "object",
		"properties": map[string]any{
			"id": map[string]any{"type": "string"},
		},
	}

	if _, err := Apply(base, ExtendObject(Property("id", map[string]any{"type": "string"}))); err == nil {
		t.Fatal("expected duplicate property error")
	}
}

func contains(values []string, want string) bool {
	for _, value := range values {
		if value == want {
			return true
		}
	}
	return false
}
