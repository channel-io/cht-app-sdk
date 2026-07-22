package schemaregistry

import (
	_ "embed"
	"encoding/json"
	"fmt"

	"github.com/channel-io/app-sdk/go/appsdk"
)

//go:embed extension_function_schemas.json
var extensionFunctionSchemasJSON []byte

var extensionFunctionSchemas = mustLoad()

func FunctionOptions(name string) []appsdk.FunctionOption {
	schema, ok := Schema(name)
	if !ok {
		return nil
	}

	options := []appsdk.FunctionOption{
		appsdk.InputSchema(schema.InputSchema),
	}
	if schema.OutputSchema != nil {
		options = append(options, appsdk.OutputSchema(schema.OutputSchema))
	}
	if schema.Description != "" {
		options = append(options, appsdk.Description(schema.Description))
	}
	return options
}

func Append(name string, options ...appsdk.FunctionOption) []appsdk.FunctionOption {
	merged := FunctionOptions(name)
	merged = append(merged, options...)
	return merged
}

func Schema(name string) (appsdk.FunctionSchema, bool) {
	schema, ok := extensionFunctionSchemas.byName[name]
	if !ok {
		return appsdk.FunctionSchema{}, false
	}
	return appsdk.FunctionSchema{
		Name:         schema.Name,
		Description:  schema.Description,
		InputSchema:  cloneSchema(schema.InputSchema),
		OutputSchema: cloneSchema(schema.OutputSchema),
	}, true
}

func Schemas() []appsdk.FunctionSchema {
	schemas := make([]appsdk.FunctionSchema, 0, len(extensionFunctionSchemas.ordered))
	for _, schema := range extensionFunctionSchemas.ordered {
		schemas = append(schemas, appsdk.FunctionSchema{
			Name:         schema.Name,
			Description:  schema.Description,
			InputSchema:  cloneSchema(schema.InputSchema),
			OutputSchema: cloneSchema(schema.OutputSchema),
		})
	}
	return schemas
}

type loadedSchemas struct {
	ordered []appsdk.FunctionSchema
	byName  map[string]appsdk.FunctionSchema
}

func mustLoad() loadedSchemas {
	var schemas []appsdk.FunctionSchema
	if err := json.Unmarshal(extensionFunctionSchemasJSON, &schemas); err != nil {
		panic(fmt.Sprintf("load extension function schemas: %v", err))
	}

	byName := make(map[string]appsdk.FunctionSchema, len(schemas))
	for _, schema := range schemas {
		if schema.Name == "" {
			panic("load extension function schemas: function name is required")
		}
		if _, exists := byName[schema.Name]; exists {
			panic(fmt.Sprintf("load extension function schemas: duplicate function name %q", schema.Name))
		}
		byName[schema.Name] = schema
	}

	return loadedSchemas{
		ordered: schemas,
		byName:  byName,
	}
}

func cloneSchema(schema map[string]any) map[string]any {
	if schema == nil {
		return nil
	}
	return cloneAny(schema).(map[string]any)
}

func cloneAny(value any) any {
	switch typed := value.(type) {
	case map[string]any:
		cloned := make(map[string]any, len(typed))
		for key, item := range typed {
			cloned[key] = cloneAny(item)
		}
		return cloned
	case []any:
		cloned := make([]any, len(typed))
		for i, item := range typed {
			cloned[i] = cloneAny(item)
		}
		return cloned
	default:
		return value
	}
}
