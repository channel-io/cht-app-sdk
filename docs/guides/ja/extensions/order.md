# Order 拡張（レガシー）

> **移行後に削除予定**: `order` extension（`extension.order.*`）はレガシーです。`id` ベースに再設計された [Commerce 拡張](commerce.md) が置き換え、すべてのアプリが `commerce` へ移行を終えると `order` extension は削除されます。**新規開発では `commerce` を使用してください。**

既存の `order` extension は `createdAt` ベースの `Order` モデルと `extension.order.*` 関数（注文取得＋キャンセル/返品/交換などのクレームアクション）を提供します。

Legacy Function:

- `extension.order.core.getAppConfigs`
- `extension.order.core.getOrders`
- `extension.order.cancel.cancelOrder`
- `extension.order.return.returnOrder`
- `extension.order.exchange.exchangeOrder`
- `extension.order.exchange.getExchangeableItems`
- `extension.order.edit.changeShippingAddress`

`commerce` はこれを再設計した拡張で、主な違いは次のとおりです。

- `buyer` フィールドを追加
- `createdAt` → `orderedAt`
- アクションの応答を `ActionResult` でラップ
- `returnAcceptOrder`（返品集荷完了）関数を追加

全関数リストと使い方は [Commerce 拡張](commerce.md) を参照してください。

## TypeScript

既存 TypeScript アプリは `@Extension({ name: "order", systemVersion: "v1" })` と
`OrderExtensionInterface` を維持できます。Named Function-level schema が export されていない場合、
full Function name を [canonical schema registry](../../../reference/typescript/EXTENSIONS.md#canonical-schema-registry)
から解決します。

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

Commerce に同等 Function がある場合、legacy model に新機能を追加しません。

## Migration・検証 checklist

1. Stable provider order ID と `orderedAt` を map し、timestamp から identity を作りません。
2. Buyer と `ActionResult` mapping を追加し、Order と Commerce を併用します。
3. Install 済みの安全な app で lookup/mutation result と duplicate delivery を比較します。
4. Registration と consumer を Commerce に移し、全 installation の移行と rollback 期間が終わって
   から Order を削除します。

Provider credential は server に置き、legacy/new mutation の両方を idempotent にします。
