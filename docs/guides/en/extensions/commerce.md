# Commerce Extension

The Commerce extension registers commerce order lookups and claim actions through a helper. The read model is the `id`-based `CommerceOrder` (with `CommerceOrderItem`), and actions wrap their result in an `ActionResult`.

> **Migration (legacy to be removed)**: `commerce` is the redesigned replacement for the legacy `order` extension (`extension.order.*`). The two coexist during migration; once every app has moved to `commerce`, the `order` extension is removed.

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

Supported methods:

- `extension.commerce.core.getAppConfigs`
- `extension.commerce.order.getOrders`
- `extension.commerce.order.cancelRequestOrder`
- `extension.commerce.order.returnRequestOrder`
- `extension.commerce.order.returnAcceptOrder`
- `extension.commerce.order.exchangeRequestOrder`
- `extension.commerce.order.getExchangeableItems`
- `extension.commerce.order.changeShippingAddress`

Value types such as address, payment, fulfillment, and claim reuse the `order` extension schemas.
