# WMS 拡張

Go SDK は WMS method を helper で登録できます。

```go
app := appsdk.New(appsdk.Options{AppID: appID})
err := app.Use(wms.Extension().
  GetSupportedCommerces(wms.StaticSupportedCommerces("app-cafe24")).
  GetOrders(handler.GetOrders).
  GetShopID(handler.GetShopID).
  CancelOrder(handler.CancelOrder),
)
```

初期 helper が扱う method:

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

> **レガシー（移行後に削除予定）**: 上記の `core` / `cancel` / `return` / `exchange` / `edit` method と `extId` ベースの `WmsOrder` / `WmsOrderItem` / `WmsDelivery` は、下の `extension.wms.order.*` グループに置き換えられます。すべてのアプリが移行を終えると、これらの method・モデルは削除され、その後 `WmsOrderV2` は `WmsOrder` にリネームされます。

既存の WMS アプリでは native client と WMS helper から導入するのが安全です。

## 注文グループ (order)

新しい `extension.wms.order.*` グループは `id` ベースの `WmsOrderV2`（`WmsOrderItemV2` / `WmsDeliveryV2` を含む）を使用し、上記のレガシー method グループを置き換えます。移行期間中はレガシーと order グループが共存し、すべてのアプリが移行を終えるとレガシーは削除されます。

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

追加 method:

- `extension.wms.core.getAppConfigs`
- `extension.wms.order.getOrders`
- `extension.wms.order.cancelRequestOrder`
- `extension.wms.order.cancelRestoreOrder`
- `extension.wms.order.returnRequestOrder`
- `extension.wms.order.returnRestoreOrder`
- `extension.wms.order.exchangeRequestOrder`
- `extension.wms.order.exchangeRestoreOrder`
- `extension.wms.order.changeShippingAddress`
