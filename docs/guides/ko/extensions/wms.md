# WMS 확장

Go SDK는 WMS method를 helper로 등록할 수 있습니다.

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
