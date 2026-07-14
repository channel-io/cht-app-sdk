package schema

import (
	"reflect"
	"strings"
	"time"

	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
)

func For[T any]() map[string]any {
	var value T
	return FromType(reflect.TypeOf(value))
}

func FromType(t reflect.Type) map[string]any {
	return fromType(t, map[reflect.Type]bool{})
}

func fromType(t reflect.Type, seen map[reflect.Type]bool) map[string]any {
	if t == nil {
		return map[string]any{"type": "object"}
	}
	for t.Kind() == reflect.Pointer {
		t = t.Elem()
	}

	if isTime(t) {
		return map[string]any{"type": "string", "format": "date-time"}
	}
	if isProtoMessage(t) {
		return protoSchema(t)
	}

	switch t.Kind() {
	case reflect.Struct:
		if seen[t] {
			return map[string]any{"type": "object"}
		}
		seen[t] = true
		schema := structSchema(t, seen)
		delete(seen, t)
		return schema
	case reflect.String:
		return map[string]any{"type": "string"}
	case reflect.Bool:
		return map[string]any{"type": "boolean"}
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return map[string]any{"type": "integer"}
	case reflect.Float32, reflect.Float64:
		return map[string]any{"type": "number"}
	case reflect.Slice, reflect.Array:
		return map[string]any{"type": "array", "items": fromType(t.Elem(), seen)}
	case reflect.Map:
		schema := map[string]any{"type": "object"}
		if t.Key().Kind() == reflect.String {
			schema["additionalProperties"] = fromType(t.Elem(), seen)
		} else {
			schema["additionalProperties"] = true
		}
		return schema
	case reflect.Interface:
		return map[string]any{}
	default:
		return map[string]any{"type": "object"}
	}
}

func structSchema(t reflect.Type, seen map[reflect.Type]bool) map[string]any {
	properties := map[string]any{}
	required := []string{}

	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		if field.PkgPath != "" {
			continue
		}

		if shouldFlatten(field) {
			embedded := fromType(field.Type, seen)
			mergeObjectSchema(properties, &required, embedded)
			continue
		}

		name, omitempty, skip := jsonName(field)
		if skip {
			continue
		}
		fieldSchema := fromType(field.Type, seen)
		applyFieldTags(fieldSchema, field.Tag.Get("schema"))
		properties[name] = fieldSchema
		if fieldRequired(field, omitempty) {
			required = append(required, name)
		}
	}

	result := map[string]any{
		"type":       "object",
		"properties": properties,
	}
	if len(required) > 0 {
		result["required"] = required
	}
	return result
}

func shouldFlatten(field reflect.StructField) bool {
	if !field.Anonymous || field.Tag.Get("json") != "" {
		return false
	}
	t := field.Type
	for t.Kind() == reflect.Pointer {
		t = t.Elem()
	}
	return t.Kind() == reflect.Struct && !isTime(t)
}

func mergeObjectSchema(properties map[string]any, required *[]string, schema map[string]any) {
	if nestedProperties, ok := schema["properties"].(map[string]any); ok {
		for name, property := range nestedProperties {
			properties[name] = property
		}
	}
	if nestedRequired, ok := schema["required"].([]string); ok {
		*required = append(*required, nestedRequired...)
	}
}

func fieldRequired(field reflect.StructField, omitempty bool) bool {
	if omitempty || field.Type.Kind() == reflect.Pointer {
		return false
	}
	tag := field.Tag.Get("schema")
	for _, part := range splitTag(tag) {
		switch part {
		case "optional":
			return false
		case "required":
			return true
		}
	}
	return true
}

func applyFieldTags(schema map[string]any, tag string) {
	for _, part := range splitTag(tag) {
		if part == "" || part == "required" || part == "optional" {
			continue
		}
		key, value, ok := strings.Cut(part, "=")
		if !ok {
			continue
		}
		switch key {
		case "description":
			schema["description"] = value
		case "format":
			schema["format"] = value
		case "enum":
			if value == "" {
				continue
			}
			schema["enum"] = strings.Split(value, "|")
		case "title":
			schema["title"] = value
		case "default":
			schema["default"] = value
		}
	}
}

func splitTag(tag string) []string {
	if tag == "" {
		return nil
	}
	return strings.Split(tag, ",")
}

func isTime(t reflect.Type) bool {
	return t == reflect.TypeOf(time.Time{})
}

func isProtoMessage(t reflect.Type) bool {
	protoType := reflect.TypeOf((*proto.Message)(nil)).Elem()
	return t.Implements(protoType) || reflect.PointerTo(t).Implements(protoType)
}

func protoSchema(t reflect.Type) map[string]any {
	for t.Kind() == reflect.Pointer {
		t = t.Elem()
	}
	if t.Kind() != reflect.Struct {
		return map[string]any{"type": "object"}
	}

	value := reflect.New(t)
	message, ok := value.Interface().(proto.Message)
	if !ok {
		return map[string]any{"type": "object"}
	}
	return protoMessageSchema(message.ProtoReflect().Descriptor(), map[protoreflect.FullName]bool{})
}

func protoMessageSchema(desc protoreflect.MessageDescriptor, seen map[protoreflect.FullName]bool) map[string]any {
	if desc == nil {
		return map[string]any{"type": "object"}
	}

	switch desc.FullName() {
	case "google.protobuf.Struct":
		return map[string]any{"type": "object", "additionalProperties": true}
	case "google.protobuf.Value":
		return map[string]any{}
	case "google.protobuf.ListValue":
		return map[string]any{"type": "array", "items": map[string]any{}}
	case "google.protobuf.Timestamp":
		return map[string]any{"type": "string", "format": "date-time"}
	case "google.protobuf.Duration":
		return map[string]any{"type": "string"}
	case "google.protobuf.Any":
		return map[string]any{
			"type": "object",
			"properties": map[string]any{
				"@type": map[string]any{"type": "string"},
				"value": map[string]any{},
			},
			"additionalProperties": true,
		}
	case "google.protobuf.Empty":
		return map[string]any{"type": "object", "properties": map[string]any{}}
	case "google.protobuf.DoubleValue", "google.protobuf.FloatValue":
		return map[string]any{"type": "number"}
	case "google.protobuf.Int32Value", "google.protobuf.UInt32Value":
		return map[string]any{"type": "integer"}
	case "google.protobuf.Int64Value", "google.protobuf.UInt64Value":
		return map[string]any{"type": "string"}
	case "google.protobuf.BoolValue":
		return map[string]any{"type": "boolean"}
	case "google.protobuf.StringValue":
		return map[string]any{"type": "string"}
	case "google.protobuf.BytesValue":
		return map[string]any{"type": "string"}
	case "google.protobuf.FieldMask":
		return map[string]any{"type": "string"}
	}

	if seen[desc.FullName()] {
		return map[string]any{"type": "object"}
	}
	seen[desc.FullName()] = true
	defer delete(seen, desc.FullName())

	properties := map[string]any{}
	fields := desc.Fields()
	for i := 0; i < fields.Len(); i++ {
		field := fields.Get(i)
		properties[field.JSONName()] = protoFieldSchema(field, seen)
	}
	return map[string]any{
		"type":       "object",
		"properties": properties,
	}
}

func protoFieldSchema(field protoreflect.FieldDescriptor, seen map[protoreflect.FullName]bool) map[string]any {
	if field.IsMap() {
		return map[string]any{
			"type":                 "object",
			"additionalProperties": protoFieldValueSchema(field.MapValue(), seen),
		}
	}
	if field.IsList() {
		return map[string]any{
			"type":  "array",
			"items": protoFieldValueSchema(field, seen),
		}
	}
	return protoFieldValueSchema(field, seen)
}

func protoFieldValueSchema(field protoreflect.FieldDescriptor, seen map[protoreflect.FullName]bool) map[string]any {
	switch field.Kind() {
	case protoreflect.BoolKind:
		return map[string]any{"type": "boolean"}
	case protoreflect.EnumKind:
		values := field.Enum().Values()
		enum := make([]string, 0, values.Len())
		for i := 0; i < values.Len(); i++ {
			enum = append(enum, string(values.Get(i).Name()))
		}
		return map[string]any{"type": "string", "enum": enum}
	case protoreflect.Int32Kind, protoreflect.Sint32Kind, protoreflect.Sfixed32Kind,
		protoreflect.Int64Kind, protoreflect.Sint64Kind, protoreflect.Sfixed64Kind,
		protoreflect.Uint32Kind, protoreflect.Fixed32Kind, protoreflect.Uint64Kind,
		protoreflect.Fixed64Kind:
		return map[string]any{"type": "integer"}
	case protoreflect.FloatKind, protoreflect.DoubleKind:
		return map[string]any{"type": "number"}
	case protoreflect.StringKind:
		return map[string]any{"type": "string"}
	case protoreflect.BytesKind:
		return map[string]any{"type": "string"}
	case protoreflect.MessageKind, protoreflect.GroupKind:
		return protoMessageSchema(field.Message(), seen)
	default:
		return map[string]any{"type": "object"}
	}
}

func jsonName(field reflect.StructField) (name string, omitempty bool, skip bool) {
	tag := field.Tag.Get("json")
	if tag == "-" {
		return "", false, true
	}
	if tag == "" {
		return field.Name, false, false
	}

	parts := strings.Split(tag, ",")
	name = parts[0]
	if name == "" {
		name = field.Name
	}
	for _, part := range parts[1:] {
		if part == "omitempty" {
			omitempty = true
			break
		}
	}
	return name, omitempty, false
}
