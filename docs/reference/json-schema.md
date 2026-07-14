# JSON Schema

Function registration exposes input and output JSON Schemas.

TypeScript apps use Zod schemas and convert them to JSON Schema. Go apps use Go
structs with `json` tags as the default type surface:

```go
type GetOrderRequest struct {
  OrderID string `json:"orderId"`
}
```

The Go SDK can generate a basic schema from a struct. Developers can override
schemas explicitly when a function needs unions, enums, custom formats, or
compatibility with an existing extension contract:

```go
app.Func(
  "extension.example.getOrder",
  appsdk.InputSchema(map[string]any{"type": "object"}),
  appsdk.Handle(handler),
)
```

Go schema generation supports:

- embedded struct flattening for composed DTOs
- typed map values as `additionalProperties`
- `schema` tags for common metadata:

```go
type SearchRequest struct {
  Status string `json:"status,omitempty" schema:"enum=open|closed,description=Order status"`
}
```

Supported tag keys are `description`, `format`, `enum`, `title`, `default`,
`required`, and `optional`.

Schema generation should stay deterministic. Avoid deriving public field names
from Go identifiers when a `json` tag can be provided.
