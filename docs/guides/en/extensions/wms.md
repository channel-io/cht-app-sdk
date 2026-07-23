# WMS Extension

Use WMS for warehouse and order-management providers. The current contract uses the ID-based
`extension.wms.order.*` Function group and `WmsOrderV2`, `WmsOrderItemV2`, and `WmsDeliveryV2`
types exported by the SDK.

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

Current methods:

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

Use `@Extension({ name: "wms", systemVersion: "v1" })` with the exported WMS schemas:
`WmsGetAppConfigs*`, `WmsOrderGetOrders*`, `WmsOrderAction*`, and
`WmsOrderChangeShippingAddress*`. Register each Function under its exact
`extension.wms.order.*` name.

## Authentication, reliability, and testing

- Resolve shop configuration from trusted Config context and verify order/shop ownership on every
  request. Never trust a shop or order ID solely because a WAM supplied it.
- Re-read provider state before cancel/return/exchange restore and shipping-address changes.
- Make every mutation idempotent and preserve the provider request/result mapping needed for retry.
- Test capability discovery, missing shop configuration, pagination, duplicate mutation delivery,
  restore races, permission denial, and rollback.

See the [TypeScript Extension reference](../../../reference/typescript/EXTENSIONS.md) and
[Go Extension reference](../../../reference/go/EXTENSIONS.md).
