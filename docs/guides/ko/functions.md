# 함수 등록

Function 요청의 `method`가 Function의 전체 이름입니다. 앱 고유 Function은 `orders.get`처럼
standalone으로 등록합니다. 표준 Extension 안에서는 `@Extension({ name: "command" })`와
`metadata.getCommands` 같은 relative name을 조합해 `extension.command.metadata.getCommands`를
만듭니다. 자세한 구분은 [핵심 개념](concepts.md)을 참고하세요.

## TypeScript

TypeScript 앱은 decorator API를 사용하세요.

```ts
@Func("orders.get")
@InputSchema(z.object({ orderId: z.string() }))
async getOrder(@Ctx() ctx: Context, @Input() input: { orderId: string }) {
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
  "orders.get",
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

공통 확장은 전용 builder를 사용할 수 있습니다. Config 기반 인증 앱은 `extension/config`로
설정 schema와 validation Function 이름을 관리합니다.

```go
app.Use(config.Extension().
  GetConfigSchema(handler.GetConfigSchema).
  ValidateStoredConfig(handler.ValidateStoredConfig),
)
```

WMS 앱은 `extension/wms` builder와 SDK Function 이름 상수, DTO를 함께 사용합니다.

서버 사이드 주요 extension은 전용 builder 패키지를 제공합니다:
`extension/config`, `extension/oauth`, `extension/calendar`,
`extension/command`, `extension/widget`, `extension/customtab`,
`extension/hook`, `extension/polling`, `extension/store`,
`extension/messaging`, `extension/alftask`, `extension/wms`.

커스텀 extension은 generic builder를 사용할 수 있습니다.

```go
app.Use(extension.New("custom").
  ExtensionFunc("metadata.getThing", appsdk.Input[extension.Empty](), appsdk.Output[Thing](), appsdk.Handle(extension.Static(thing))).
  Func("custom.execute", appsdk.Input[Input](), appsdk.Output[Output](), appsdk.Handle(execute)),
)
```
