package apikey

import (
	"github.com/channel-io/app-sdk/go/appsdk"
	"github.com/channel-io/app-sdk/go/extension/schemaregistry"
)

func FunctionOptions(name string) []appsdk.FunctionOption {
	return schemaregistry.FunctionOptions(name)
}

func CanonicalFunctionSchemas() []appsdk.FunctionSchema {
	names := []string{
		FunctionGetAuthConfig,
		FunctionValidateCredentials,
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
