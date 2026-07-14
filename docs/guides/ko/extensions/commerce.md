# Commerce 확장

Commerce 확장은 커머스 주문 조회와 클레임 액션을 helper로 등록합니다. 조회 모델은 `id` 기반 `CommerceOrder`(`CommerceOrderItem` 포함)이며, 액션은 결과를 `ActionResult`로 감쌉니다.

> **마이그레이션 (레거시 제거 예정)**: `commerce`는 레거시 `order` extension(`extension.order.*`)을 재설계한 대체 확장입니다. 마이그레이션 기간에는 둘이 공존하고, 모든 앱이 `commerce`로 이전을 마치면 `order` extension은 제거됩니다.

```go
app := appsdk.New(appsdk.Options{AppID: appID})
err := app.Use(commerce.Extension().
  GetAppConfigs(handler.GetAppConfigs).
  GetOrders(handler.GetOrders).
  CancelRequestOrder(handler.CancelRequestOrder).
  ReturnRequestOrder(handler.ReturnRequestOrder).
  ReturnAcceptOrder(handler.ReturnAcceptOrder).
  ExchangeRequestOrder(handler.ExchangeRequestOrder).
  GetExchangeableItems(handler.GetExchangeableItems).
  ChangeShippingAddress(handler.ChangeShippingAddress),
)
```

지원 method:

- `extension.commerce.core.getAppConfigs`
- `extension.commerce.order.getOrders`
- `extension.commerce.order.cancelRequestOrder`
- `extension.commerce.order.returnRequestOrder`
- `extension.commerce.order.returnAcceptOrder`
- `extension.commerce.order.exchangeRequestOrder`
- `extension.commerce.order.getExchangeableItems`
- `extension.commerce.order.changeShippingAddress`

주소·결제·이행·클레임 등 값 타입은 `order` 확장 스키마를 재사용합니다.
