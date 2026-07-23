# WMS 확장

WMS는 warehouse와 order-management provider를 연결할 때 사용합니다. 현재 계약은 ID 기반
`extension.wms.order.*` Function group과 SDK가 export하는 `WmsOrderV2`, `WmsOrderItemV2`,
`WmsDeliveryV2` 타입을 사용합니다.

## Go

```go
app := appsdk.New(appsdk.Options{AppID: appID})
err := app.Use(wms.Extension().
  GetAppConfigs(handler.GetAppConfigs).
  OrderGetOrders(handler.OrderGetOrders).
  OrderCancelRequestOrder(handler.OrderCancelRequestOrder).
  OrderCancelRestoreOrder(handler.OrderCancelRestoreOrder).
  OrderReturnRequestOrder(handler.OrderReturnRequestOrder).
  OrderReturnRestoreOrder(handler.OrderReturnRestoreOrder).
  OrderExchangeRequestOrder(handler.OrderExchangeRequestOrder).
  OrderExchangeRestoreOrder(handler.OrderExchangeRestoreOrder).
  OrderChangeShippingAddress(handler.OrderChangeShippingAddress),
)
```

현재 method:

- `extension.wms.core.getAppConfigs`
- `extension.wms.order.getOrders`
- `extension.wms.order.cancelRequestOrder`
- `extension.wms.order.cancelRestoreOrder`
- `extension.wms.order.returnRequestOrder`
- `extension.wms.order.returnRestoreOrder`
- `extension.wms.order.exchangeRequestOrder`
- `extension.wms.order.exchangeRestoreOrder`
- `extension.wms.order.changeShippingAddress`

## TypeScript

`@Extension({ name: "wms", systemVersion: "v1" })`과 공개 WMS schema인
`WmsGetAppConfigs*`, `WmsOrderGetOrders*`, `WmsOrderAction*`,
`WmsOrderChangeShippingAddress*`를 사용합니다. 각 Function은 정확한
`extension.wms.order.*` 이름으로 등록합니다.

## 인증·신뢰성·테스트

- 신뢰할 수 있는 Config context에서 shop 설정을 찾고 모든 request에서 order/shop ownership을
  검증합니다. WAM이 전달한 shop/order ID만 신뢰하지 않습니다.
- 취소·반품·교환 restore와 배송지 변경 전에 provider 상태를 다시 조회합니다.
- 모든 mutation을 idempotent하게 만들고 retry에 필요한 provider request/result mapping을 보존합니다.
- Capability discovery, shop 설정 누락, pagination, duplicate mutation, restore race,
  permission denial, rollback을 테스트합니다.

[TypeScript Extension 레퍼런스](../../../reference/typescript/EXTENSIONS.md)와
[Go Extension 레퍼런스](../../../reference/go/EXTENSIONS.md)를 확인하세요.
