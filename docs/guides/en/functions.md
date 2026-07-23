# Function Registration

The request `method` is the Function's full name. Register app-specific behavior as a standalone
Function such as `orders.get`. Inside a standard Extension, combine
`@Extension({ name: "command" })` with a relative name such as `metadata.getCommands` to produce
`extension.command.metadata.getCommands`. See [Concepts](concepts.md) for the distinction.

## TypeScript

Use the decorator API for TypeScript apps.

```ts
@Func("orders.get")
@InputSchema(z.object({ orderId: z.string() }))
async getOrder(@Ctx() ctx: Context, @Input() input: { orderId: string }) {
  return this.service.getOrder(ctx.channel.id, input.orderId);
}
```

## Go

Go uses builders and generic handlers instead of decorators.

```go
type GetOrderInput struct {
  OrderID string `json:"orderId"`
}

type GetOrderOutput struct {
  ID string `json:"id"`
}

appsdk.MustRegister(
  app,
  "orders.get",
  func(ctx context.Context, fnCtx appsdk.Context, in *GetOrderInput) (*GetOrderOutput, error) {
    return &GetOrderOutput{ID: in.OrderID}, nil
  },
)
```

`appsdk.Register` and `appsdk.MustRegister` derive input/output schemas from
Go structs and call `Validate() error` on inputs that implement it. Use
`appsdk.InputSchema` or `appsdk.OutputSchema` when a function needs an explicit
schema override.

## Extension Builders

Common extensions can use dedicated builders. Config-based authentication apps use
`extension/config` for their setup schema and validation Function names.

```go
app.Use(config.Extension().
  GetConfigSchema(handler.GetConfigSchema).
  ValidateStoredConfig(handler.ValidateStoredConfig),
)
```

WMS apps use the `extension/wms` builder with SDK Function name constants and DTOs.

Known server-side extension families have builder packages:
`extension/config`, `extension/oauth`, `extension/calendar`,
`extension/command`, `extension/widget`, `extension/customtab`,
`extension/hook`, `extension/polling`, `extension/store`,
`extension/messaging`, `extension/alftask`, and `extension/wms`.

For custom extensions, use the generic builder:

```go
app.Use(extension.New("custom").
  ExtensionFunc("metadata.getThing", appsdk.Input[extension.Empty](), appsdk.Output[Thing](), appsdk.Handle(extension.Static(thing))).
  Func("custom.execute", appsdk.Input[Input](), appsdk.Output[Output](), appsdk.Handle(execute)),
)
```
