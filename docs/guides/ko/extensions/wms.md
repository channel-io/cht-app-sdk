# WMS 확장

Go SDK는 WMS method를 helper로 등록할 수 있습니다.

## Go

```go
app := appsdk.New(appsdk.Options{AppID: appID})
err := app.Use(wms.Extension().
  GetSupportedCommerces(wms.StaticSupportedCommerces("commerce-provider")).
  GetOrders(handler.GetOrders).
  GetShopID(handler.GetShopID).
  CancelOrder(handler.CancelOrder),
)
```

초기 helper는 다음 method를 다룹니다.

- `extension.wms.metadata.getSupportedCommerces`
- `extension.wms.core.getOrders`
- `extension.wms.core.getOrder`
- `extension.wms.core.getShopId`
- `extension.wms.cancel.cancelOrder`
- `extension.wms.cancel.restoreOrder`
- `extension.wms.return.returnOrder`
- `extension.wms.return.restoreOrder`
- `extension.wms.exchange.exchangeOrder`
- `extension.wms.exchange.restoreOrder`
- `extension.wms.edit.changeShippingAddress`

> **레거시 (마이그레이션 이후 제거 예정)**: 위 `core` / `cancel` / `return` / `exchange` / `edit` method와 `extId` 기반 `WmsOrder` / `WmsOrderItem` / `WmsDelivery`는 아래 `extension.wms.order.*` 그룹으로 대체됩니다. 모든 앱이 이전을 마치면 이 method·모델은 제거되고, 이후 `WmsOrderV2` → `WmsOrder`로 rename됩니다.

기존 WMS 앱은 native client와 WMS helper를 먼저 도입하는 것이 가장 안전한 순서입니다.

## 주문 그룹 (order)

신규 `extension.wms.order.*` 그룹은 `id` 기반 `WmsOrderV2`(`WmsOrderItemV2` / `WmsDeliveryV2` 포함)를 사용하며, 위 레거시 method 그룹을 대체합니다. 마이그레이션 기간에는 레거시와 order 그룹이 공존하고, 전 앱 이전 완료 후 레거시는 제거됩니다.

```go
app.Use(wms.Extension().
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

추가 method:

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

`@Extension({ name: "wms", systemVersion: "v1" })`과 공개 WMS schema를 사용합니다. 신규 코드는
`extension.wms.order.*` 그룹의 `WmsGetAppConfigs*`, `WmsOrderGetOrders*`, `WmsOrderAction*`,
`WmsOrderChangeShippingAddress*` schema를 사용합니다. 설치 앱 migration 동안에만 legacy schema
handler를 유지합니다.

## 인증·신뢰성·테스트

- 신뢰할 수 있는 Config context에서 shop 설정을 찾고 모든 request에서 order/shop ownership을
  검증합니다. WAM이 전달한 shop/order ID만 신뢰하지 않습니다.
- 취소·반품·교환 restore와 배송지 변경 전에 provider 상태를 다시 조회합니다.
- 모든 mutation을 idempotent하게 만들고 retry에 필요한 provider request/result mapping을 보존합니다.
- Capability discovery, shop 설정 누락, pagination, legacy/new 혼합 등록, duplicate mutation,
  restore race, permission denial, rollback을 테스트합니다.

[TypeScript Extension 레퍼런스](../../../reference/typescript/EXTENSIONS.md)와
[Go Extension 레퍼런스](../../../reference/go/EXTENSIONS.md)를 확인하세요.
