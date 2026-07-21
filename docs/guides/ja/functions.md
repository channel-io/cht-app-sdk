# Function 登録

Request の `method` が Function の完全名です。App 固有の処理は `orders.get` のような standalone Function として登録します。標準 Extension 内では `@Extension({ name: "order" })` と relative name を組み合わせて `extension.order.{relativeName}` を作ります。違いは [基本概念](concepts.md) を参照してください。

## TypeScript

新規 TypeScript app では decorator API を使ってください。Legacy simple API も export されていますが、その service は deprecated で削除予定です。

```ts
@Func("orders.get")
@InputSchema(z.object({ orderId: z.string() }))
async getOrder(@Ctx() ctx: Context, @Input() input: { orderId: string }) {
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
  "orders.get",
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
