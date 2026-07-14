package config

import (
	"github.com/channel-io/cht-app-sdk/go/appsdk"
	"github.com/channel-io/cht-app-sdk/go/extension/schemaregistry"
)

func FunctionOptions(name string, opts ...appsdk.FunctionOption) []appsdk.FunctionOption {
	return schemaregistry.Append(name, opts...)
}

func CanonicalFunctionSchemas() []appsdk.FunctionSchema {
	names := []string{
		FunctionGetConfigSchema,
		FunctionValidateStoredConfig,
	}

	functions := make([]appsdk.FunctionSchema, 0, len(names))
	for _, name := range names {
		schema, ok := schemaregistry.Schema(name)
		if ok {
			functions = append(functions, schema)
		}
	}
	return functions
}
