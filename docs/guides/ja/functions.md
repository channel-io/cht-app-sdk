# Function 登録

## TypeScript

TypeScript は decorator API と simple API の両方を提供します。

```ts
@Func("extension.order.get")
@InputSchema(z.object({ orderId: z.string() }))
async getOrder(@Ctx() ctx: FunctionContext, @Input() input: { orderId: string }) {
  return this.service.getOrder(ctx.channel.id, input.orderId);
}
```

## Go

Go は decorator の代わりに builder と generic handler を使います。

```go
type GetOrderInput struct {
  OrderID string `json:"orderId"`
}

type GetOrderOutput struct {
  ID string `json:"id"`
}

appsdk.MustRegister(
  app,
  "extension.order.get",
  func(ctx context.Context, fnCtx appsdk.Context, in *GetOrderInput) (*GetOrderOutput, error) {
    return &GetOrderOutput{ID: in.OrderID}, nil
  },
)
```

`appsdk.Register` と `appsdk.MustRegister` は Go struct から input/output
schema を生成し、input が `Validate() error` を実装している場合は自動的に
呼び出します。明示的な schema override が必要な場合は
`appsdk.InputSchema` または `appsdk.OutputSchema` を使います。

## Extension Builder

共通 extension は専用 builder を使えます。API key 認証アプリでは
`extension/apikey` が extension 宣言と function 名を管理します。

```go
app.Use(apikey.Extension().
  GetAuthConfig(apikey.StaticAuthConfig(&authConfig)).
  ValidateCredentials(validateCredentials),
)
```

WMS アプリでは `extension/wms` builder と SDK の function 名定数を併用できる
ため、一部の function だけを SDK 方式へ段階的に移行できます。

主要な server-side extension には専用 builder package があります:
`extension/config`, `extension/oauth`, `extension/calendar`,
`extension/command`, `extension/widget`, `extension/customtab`,
`extension/hook`, `extension/polling`, `extension/store`,
`extension/messaging`, `extension/alftask`, `extension/apikey`,
`extension/wms`.

custom extension には generic builder を使えます。

```go
app.Use(extension.New("custom").
  ExtensionFunc("metadata.getThing", appsdk.Input[extension.Empty](), appsdk.Output[Thing](), appsdk.Handle(extension.Static(thing))).
  Func("custom.execute", appsdk.Input[Input](), appsdk.Output[Output](), appsdk.Handle(execute)),
)
```
