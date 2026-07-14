# Order 拡張（レガシー）

> **移行後に削除予定**: `order` extension（`extension.order.*`）はレガシーです。`id` ベースに再設計された [Commerce 拡張](commerce.md) が置き換え、すべてのアプリが `commerce` へ移行を終えると `order` extension は削除されます。**新規開発では `commerce` を使用してください。**

既存の `order` extension は `createdAt` ベースの `Order` モデルと `extension.order.*` 関数（注文取得＋キャンセル/返品/交換などのクレームアクション）を提供します。

`commerce` はこれを再設計した拡張で、主な違いは次のとおりです。

- `buyer` フィールドを追加
- `createdAt` → `orderedAt`
- アクションの応答を `ActionResult` でラップ
- `returnAcceptOrder`（返品集荷完了）関数を追加

全関数リストと使い方は [Commerce 拡張](commerce.md) を参照してください。
