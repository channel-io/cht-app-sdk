# Order Extension (legacy)

> **To be removed after migration**: the `order` extension (`extension.order.*`) is legacy. The redesigned, `id`-based [Commerce extension](commerce.md) supersedes it, and once every app has migrated to `commerce` the `order` extension is removed. **Use `commerce` for new development.**

The legacy `order` extension provides the `createdAt`-based `Order` model and the `extension.order.*` functions (order lookup plus cancel/return/exchange claim actions).

Legacy Functions:

- `extension.order.core.getAppConfigs`
- `extension.order.core.getOrders`
- `extension.order.cancel.cancelOrder`
- `extension.order.return.returnOrder`
- `extension.order.exchange.exchangeOrder`
- `extension.order.exchange.getExchangeableItems`
- `extension.order.edit.changeShippingAddress`

`commerce` is the redesign of this extension. The main differences are:

- adds a `buyer` field
- `createdAt` → `orderedAt`
- wraps action responses in `ActionResult`
- adds a `returnAcceptOrder` (return pickup completed) function

See the [Commerce extension](commerce.md) for the full function list and usage.

## TypeScript

TypeScript can keep an existing `@Extension({ name: "order", systemVersion: "v1" })` implementation
with `OrderExtensionInterface`. Resolve full Function names through the
[canonical schema registry](../../../reference/typescript/EXTENSIONS.md#canonical-schema-registry)
when a named Function-level schema is not exported.

## Go

```go
err := app.Use(order.Extension().
  GetAppConfigs(handler.GetAppConfigs).
  GetOrders(handler.GetOrders).
  CancelOrder(handler.CancelOrder).
  ReturnOrder(handler.ReturnOrder).
  ExchangeOrder(handler.ExchangeOrder).
  GetExchangeableItems(handler.GetExchangeableItems).
  ChangeShippingAddress(handler.ChangeShippingAddress))
```

Do not add new behavior to the legacy model when an equivalent Commerce Function exists.

## Migration and verification checklist

1. Map stable provider order IDs and `orderedAt`; do not synthesize identity from timestamps.
2. Add buyer and `ActionResult` mapping and implement Commerce alongside Order.
3. Compare lookup and mutation results in a safe installed app, including duplicate delivery.
4. Move registration and consumers to Commerce, then remove Order only after all installations have
   migrated and rollback is no longer required.

Keep provider credentials server-side and make every legacy or new mutation idempotent.
