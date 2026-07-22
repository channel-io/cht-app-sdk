package appsdk

import (
	"encoding/json"
	"fmt"

	"github.com/channel-io/app-sdk/go/schema"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

type ResultMarshaler interface {
	MarshalSDKResult() (json.RawMessage, error)
}

type ExtraFields map[string]any

type Extensible[T any] struct {
	Base   *T
	Fields ExtraFields
}

func WithExtraFields[T any](base *T, fields map[string]any) *Extensible[T] {
	return &Extensible[T]{
		Base:   base,
		Fields: ExtraFields(fields),
	}
}

func ExtensibleOutput[T any](fields ...schema.PropertySpec) FunctionOption {
	return func(def *functionDefinition) error {
		outputSchema := schema.For[T]()
		outputSchema["additionalProperties"] = true
		if len(fields) > 0 {
			patched, err := schema.Apply(outputSchema, schema.ExtendObject(fields...))
			if err != nil {
				return fmt.Errorf("extend output schema for %q: %w", def.schema.Name, err)
			}
			outputSchema = patched
		}
		def.schema.OutputSchema = outputSchema
		return nil
	}
}

func (e *Extensible[T]) MarshalJSON() ([]byte, error) {
	return e.MarshalSDKResult()
}

func (e *Extensible[T]) MarshalSDKResult() (json.RawMessage, error) {
	if e == nil {
		return json.RawMessage(`{}`), nil
	}

	base, err := marshalResult(e.Base)
	if err != nil {
		return nil, err
	}

	result := map[string]json.RawMessage{}
	if err := json.Unmarshal(base, &result); err != nil {
		return nil, fmt.Errorf("SDK output base must marshal to a JSON object: %w", err)
	}

	standardFields := outputFieldNames[T]()
	for key, value := range e.Fields {
		if key == "" {
			return nil, fmt.Errorf("extra output field name must not be empty")
		}
		if _, exists := standardFields[key]; exists {
			return nil, fmt.Errorf("extra output field %q conflicts with SDK output field", key)
		}
		if _, exists := result[key]; exists {
			return nil, fmt.Errorf("extra output field %q conflicts with SDK output field", key)
		}

		data, err := marshalJSONValue(value)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal extra output field %q: %w", key, err)
		}
		result[key] = data
	}

	data, err := json.Marshal(result)
	if err != nil {
		return nil, err
	}
	return data, nil
}

func outputFieldNames[T any]() map[string]struct{} {
	names := map[string]struct{}{}
	outputSchema := schema.For[T]()
	properties, ok := outputSchema["properties"].(map[string]any)
	if !ok {
		return names
	}
	for name := range properties {
		names[name] = struct{}{}
	}
	return names
}

func marshalResult(output any) (json.RawMessage, error) {
	if output == nil {
		return json.RawMessage(`{}`), nil
	}
	return marshalJSONValue(output)
}

func marshalProtoResult(output any) (json.RawMessage, error) {
	if output == nil {
		return json.RawMessage(`{}`), nil
	}
	if marshaler, ok := output.(ResultMarshaler); ok {
		return marshaler.MarshalSDKResult()
	}
	message, ok := output.(proto.Message)
	if !ok {
		return nil, fmt.Errorf("proto output does not implement proto.Message: %T", output)
	}
	return marshalJSONValue(message)
}

func marshalJSONValue(value any) (json.RawMessage, error) {
	if value == nil {
		return json.RawMessage(`null`), nil
	}
	if marshaler, ok := value.(ResultMarshaler); ok {
		return marshaler.MarshalSDKResult()
	}
	if message, ok := value.(proto.Message); ok {
		data, err := protojson.MarshalOptions{}.Marshal(message)
		if err != nil {
			return nil, err
		}
		return data, nil
	}

	data, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}
	return data, nil
}
