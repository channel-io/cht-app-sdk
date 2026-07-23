# WMS Extension

The Go SDK can register WMS methods through a helper.

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

Initial supported methods:

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

> **Legacy (to be removed after migration)**: the `core` / `cancel` / `return` / `exchange` / `edit` methods above and the `extId`-based `WmsOrder` / `WmsOrderItem` / `WmsDelivery` are superseded by the `extension.wms.order.*` group below. Once every app has migrated, these methods and models are removed, after which `WmsOrderV2` is renamed to `WmsOrder`.

For an existing WMS app, start with the native client and WMS helper before broader function migration.

## Order group (order)

The new `extension.wms.order.*` group uses the `id`-based `WmsOrderV2` (with `WmsOrderItemV2` / `WmsDeliveryV2`) and supersedes the legacy method groups above. During migration the legacy and order groups coexist; once every app has migrated, the legacy set is removed.

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

Additional methods:

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

Use `@Extension({ name: "wms", systemVersion: "v1" })` with the exported WMS schemas. New code should
use `WmsGetAppConfigs*`, `WmsOrderGetOrders*`, `WmsOrderAction*`, and
`WmsOrderChangeShippingAddress*` schemas for the `extension.wms.order.*` group. Keep legacy schema
handlers only while installed apps are migrating.

## Authentication, reliability, and testing

- Resolve shop configuration from trusted Config context and verify order/shop ownership on every
  request. Never trust a shop or order ID solely because a WAM supplied it.
- Re-read provider state before cancel/return/exchange restore and shipping-address changes.
- Make every mutation idempotent and preserve the provider request/result mapping needed for retry.
- Test capability discovery, missing shop configuration, pagination, mixed legacy/new registrations,
  duplicate mutation delivery, restore races, permission denial, and rollback.

See the [TypeScript Extension reference](../../../reference/typescript/EXTENSIONS.md) and
[Go Extension reference](../../../reference/go/EXTENSIONS.md).
