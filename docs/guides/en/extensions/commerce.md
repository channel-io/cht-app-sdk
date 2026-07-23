# Commerce Extension

The Commerce extension registers commerce order lookups and claim actions through a helper. The read model is the `id`-based `CommerceOrder` (with `CommerceOrderItem`), and actions wrap their result in an `ActionResult`.

> **Migration (legacy to be removed)**: `commerce` is the redesigned replacement for the legacy `order` extension (`extension.order.*`). The two coexist during migration; once every app has moved to `commerce`, the `order` extension is removed.

## Go

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

## TypeScript

Use `@Extension({ name: "commerce", systemVersion: "v1" })` and the canonical schemas exported by
`@channel.io/app-sdk-server`: `CommerceGetAppConfigsOutputSchema`,
`CommerceGetOrdersInputSchema`/`CommerceGetOrdersOutputSchema`, the action input schemas, and
`CommerceResultSchema`. Use the exact relative names listed above and add the class to the NestJS
providers. Do not reuse the legacy `Order` input/output schemas for Commerce Functions.

## Authentication, reliability, and testing

- Read provider credentials from Config or OAuth context; never accept credentials from a WAM.
- Bind the requested shop/order to trusted Function context before using an app/channel token.
- Re-read provider order state before every mutation and return an explicit unsupported or failed
  `ActionResult` when the operation cannot be applied.
- Use an idempotency key for cancel, return, exchange, acceptance, and address-change requests.
- Test lookup pagination, partial orders, already-completed claims, duplicate mutation delivery,
  provider timeout, permission denial, and unsupported capabilities.

See the [TypeScript Extension reference](../../../reference/typescript/EXTENSIONS.md) and
[Go Extension reference](../../../reference/go/EXTENSIONS.md).
