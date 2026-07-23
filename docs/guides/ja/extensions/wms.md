# WMS 拡張

Go SDK は WMS method を helper で登録できます。

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

## TypeScript

`@Extension({ name: "wms", systemVersion: "v1" })` と公開 WMS schema を使います。新規コードは
`extension.wms.order.*` group の `WmsGetAppConfigs*`、`WmsOrderGetOrders*`、`WmsOrderAction*`、
`WmsOrderChangeShippingAddress*` schema を使います。Installation の移行中だけ legacy schema
handler を維持します。

## 認証・信頼性・test

- 信頼済み Config context から shop configuration を解決し、request ごとに order/shop ownership
  を検証します。WAM が渡した shop/order ID だけを信用しません。
- Cancel/return/exchange restore と shipping-address change 前に provider state を再取得します。
- 全 mutation を idempotent にし、retry に必要な provider request/result mapping を保存します。
- Capability discovery、shop config 不足、pagination、legacy/new 混在 registration、duplicate
  mutation、restore race、permission denial、rollback を test します。

[TypeScript Extension reference](../../../reference/typescript/EXTENSIONS.md) と
[Go Extension reference](../../../reference/go/EXTENSIONS.md) を参照してください。
