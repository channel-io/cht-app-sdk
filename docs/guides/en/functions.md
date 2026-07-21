# Function Registration

The request `method` is the Function's full name. Register app-specific behavior as a standalone Function such as `orders.get`. Inside a standard Extension, combine `@Extension({ name: "order" })` with a relative name to produce `extension.order.{relativeName}`. See [Concepts](concepts.md) for the distinction.

## TypeScript

Use the decorator API for new TypeScript apps. A legacy simple API is still exported, but its service is deprecated and scheduled for removal.

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

Common extensions can use dedicated builders. For API key authentication apps,
`extension/apikey` owns extension declaration and function names.

```go
app.Use(apikey.Extension().
  GetAuthConfig(apikey.StaticAuthConfig(&authConfig)).
  ValidateCredentials(validateCredentials),
)
```

WMS apps can mix the `extension/wms` builder with SDK function name constants,
so teams can migrate only part of an app to the SDK style at a time.

Known server-side extension families have builder packages:
`extension/config`, `extension/oauth`, `extension/calendar`,
`extension/command`, `extension/widget`, `extension/customtab`,
`extension/hook`, `extension/polling`, `extension/store`,
`extension/messaging`, `extension/alftask`, `extension/apikey`, and
`extension/wms`.

For custom extensions, use the generic builder:

```go
app.Use(extension.New("custom").
  ExtensionFunc("metadata.getThing", appsdk.Input[extension.Empty](), appsdk.Output[Thing](), appsdk.Handle(extension.Static(thing))).
  Func("custom.execute", appsdk.Input[Input](), appsdk.Output[Output](), appsdk.Handle(execute)),
)
```
