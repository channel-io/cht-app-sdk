package schema

import (
	"fmt"
	"strings"
)

type PropertySpec struct {
	Name     string
	Schema   map[string]any
	Required bool
}

type PropertyOption func(*PropertySpec)

type Patch func(map[string]any) (map[string]any, error)

func Property(name string, propertySchema map[string]any, opts ...PropertyOption) PropertySpec {
	spec := PropertySpec{
		Name:   strings.TrimSpace(name),
		Schema: Clone(propertySchema),
	}
	for _, opt := range opts {
		if opt != nil {
			opt(&spec)
		}
	}
	return spec
}

func Required() PropertyOption {
	return func(spec *PropertySpec) {
		spec.Required = true
	}
}

func ExtendObject(properties ...PropertySpec) Patch {
	return ExtendObjectAt("", properties...)
}

func ExtendObjectAt(path string, properties ...PropertySpec) Patch {
	return func(base map[string]any) (map[string]any, error) {
		cloned := Clone(base)
		target, err := objectAt(cloned, path)
		if err != nil {
			return nil, err
		}
		if err := addProperties(target, properties...); err != nil {
			return nil, err
		}
		return cloned, nil
	}
}

func Apply(base map[string]any, patches ...Patch) (map[string]any, error) {
	cloned := Clone(base)
	var err error
	for _, patch := range patches {
		if patch == nil {
			continue
		}
		cloned, err = patch(cloned)
		if err != nil {
			return nil, err
		}
	}
	return cloned, nil
}

func Clone(schema map[string]any) map[string]any {
	if schema == nil {
		return nil
	}
	cloned, ok := cloneAny(schema).(map[string]any)
	if !ok {
		return nil
	}
	return cloned
}

func cloneAny(value any) any {
	switch typed := value.(type) {
	case map[string]any:
		cloned := make(map[string]any, len(typed))
		for key, item := range typed {
			cloned[key] = cloneAny(item)
		}
		return cloned
	case []string:
		cloned := make([]string, len(typed))
		copy(cloned, typed)
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

func objectAt(root map[string]any, path string) (map[string]any, error) {
	current := root
	trimmed := strings.TrimSpace(path)
	if trimmed == "" {
		return ensureObject(current, "schema")
	}

	for _, rawSegment := range strings.Split(trimmed, ".") {
		segment := strings.TrimSpace(rawSegment)
		if segment == "" {
			return nil, fmt.Errorf("schema path %q contains an empty segment", path)
		}

		arrayItems := strings.HasSuffix(segment, "[]")
		if arrayItems {
			segment = strings.TrimSuffix(segment, "[]")
			if segment == "" {
				return nil, fmt.Errorf("schema path %q contains an empty array property", path)
			}
		}

		properties, ok := current["properties"].(map[string]any)
		if !ok {
			return nil, fmt.Errorf("schema path %q cannot resolve %q: object has no properties", path, segment)
		}
		next, ok := properties[segment].(map[string]any)
		if !ok {
			return nil, fmt.Errorf("schema path %q cannot resolve property %q", path, segment)
		}
		if arrayItems {
			items, ok := next["items"].(map[string]any)
			if !ok {
				return nil, fmt.Errorf("schema path %q expected %q to be an array with object items", path, segment)
			}
			next = items
		}
		current = next
	}

	return ensureObject(current, path)
}

func ensureObject(schema map[string]any, label string) (map[string]any, error) {
	if schema == nil {
		return nil, fmt.Errorf("%s schema is nil", label)
	}
	if schemaType, ok := schema["type"].(string); ok && schemaType != "object" {
		return nil, fmt.Errorf("%s schema is %q, not object", label, schemaType)
	}
	properties, ok := schema["properties"].(map[string]any)
	if !ok {
		properties = map[string]any{}
		schema["properties"] = properties
	}
	return schema, nil
}

func addProperties(target map[string]any, properties ...PropertySpec) error {
	targetProperties, ok := target["properties"].(map[string]any)
	if !ok {
		targetProperties = map[string]any{}
		target["properties"] = targetProperties
	}

	for _, property := range properties {
		if property.Name == "" {
			return fmt.Errorf("schema property name must not be empty")
		}
		if _, exists := targetProperties[property.Name]; exists {
			return fmt.Errorf("schema property %q already exists", property.Name)
		}
		targetProperties[property.Name] = Clone(property.Schema)
		if property.Required {
			appendRequired(target, property.Name)
		}
	}
	return nil
}

func appendRequired(schema map[string]any, name string) {
	switch required := schema["required"].(type) {
	case []string:
		for _, existing := range required {
			if existing == name {
				return
			}
		}
		schema["required"] = append(required, name)
	case []any:
		for _, existing := range required {
			if existing == name {
				return
			}
		}
		schema["required"] = append(required, name)
	default:
		schema["required"] = []string{name}
	}
}
