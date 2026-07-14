# Commerce 拡張

Commerce 拡張は、コマース注文の取得とクレームアクションを helper で登録します。取得モデルは `id` ベースの `CommerceOrder`（`CommerceOrderItem` を含む）で、アクションは結果を `ActionResult` でラップします。

> **移行（レガシー削除予定）**: `commerce` はレガシー `order` extension（`extension.order.*`）を再設計した置き換え拡張です。移行期間中は両者が共存し、すべてのアプリが `commerce` へ移行を終えると `order` extension は削除されます。

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

対応 method:

- `extension.commerce.core.getAppConfigs`
- `extension.commerce.order.getOrders`
- `extension.commerce.order.cancelRequestOrder`
- `extension.commerce.order.returnRequestOrder`
- `extension.commerce.order.returnAcceptOrder`
- `extension.commerce.order.exchangeRequestOrder`
- `extension.commerce.order.getExchangeableItems`
- `extension.commerce.order.changeShippingAddress`

住所・決済・履行・クレームなどの値型は `order` 拡張のスキーマを再利用します。
