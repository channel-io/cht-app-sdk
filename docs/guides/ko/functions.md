# 함수 등록

## TypeScript

TypeScript는 decorator API와 simple API를 모두 제공합니다.

```ts
@Func("extension.order.get")
@InputSchema(z.object({ orderId: z.string() }))
async getOrder(@Ctx() ctx: FunctionContext, @Input() input: { orderId: string }) {
  return this.service.getOrder(ctx.channel.id, input.orderId);
}
```

## Go

Go는 decorator 대신 builder와 generic handler를 사용합니다.

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

`appsdk.Register`와 `appsdk.MustRegister`는 Go struct에서 입출력 schema를
생성하고, 입력 타입이 `Validate() error`를 구현하면 자동으로 호출합니다.
명시적인 schema가 필요하면 `appsdk.InputSchema` 또는 `appsdk.OutputSchema`를
사용합니다.

## 확장 빌더

공통 확장은 전용 builder를 사용할 수 있습니다. 예를 들어 API key 인증 앱은
`extension/apikey`가 확장 선언과 함수명을 대신 관리합니다.

```go
app.Use(apikey.Extension().
  GetAuthConfig(apikey.StaticAuthConfig(&authConfig)).
  ValidateCredentials(validateCredentials),
)
```

WMS 앱은 `extension/wms` builder와 함수명 상수를 함께 사용할 수 있어, 일부
함수만 SDK 방식으로 옮기는 점진적 전환도 가능합니다.

서버 사이드 주요 extension은 전용 builder 패키지를 제공합니다:
`extension/config`, `extension/oauth`, `extension/calendar`,
`extension/command`, `extension/widget`, `extension/customtab`,
`extension/hook`, `extension/polling`, `extension/store`,
`extension/messaging`, `extension/alftask`, `extension/apikey`,
`extension/wms`.

커스텀 extension은 generic builder를 사용할 수 있습니다.

```go
app.Use(extension.New("custom").
  ExtensionFunc("metadata.getThing", appsdk.Input[extension.Empty](), appsdk.Output[Thing](), appsdk.Handle(extension.Static(thing))).
  Func("custom.execute", appsdk.Input[Input](), appsdk.Output[Output](), appsdk.Handle(execute)),
)
```
