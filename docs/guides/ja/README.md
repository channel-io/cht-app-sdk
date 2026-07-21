# Channel App SDK ガイド

このガイドは、Channel アプリ開発者が TypeScript SDK と Go SDK を同じ考え方で使えるようにまとめたものです。

## ドキュメント

- [基本概念](concepts.md)
- [クイックスタート](quickstart.md)
- [アプリ開発完全ガイド](app-development.md)
- [旧 Web ドキュメントとの差分](legacy-documentation-notes.md)
- [Function 登録](functions.md)
- [部分移行](partial-migration.md)
- [WMS 拡張](extensions/wms.md)
- [Order 拡張（レガシー）](extensions/order.md)
- [Commerce 拡張](extensions/commerce.md)

## SDK の選び方

NestJS、Zod、WAM React 開発には TypeScript SDK が向いています。既存の Go サービスに typed function、native client、extension helper を段階的に入れる場合は Go SDK が向いています。

Web 記事、チュートリアル、SDK 例が一致しない場合は、公開 SDK export、SDK reference、最新 tutorial の順で確認してください。

## 実行可能な例

- [TypeScript app tutorial](https://github.com/channel-io/app-tutorial-ts)
- [Go app tutorial](https://github.com/channel-io/app-tutorial)

## 言語別リファレンス

- [TypeScript architecture](../../reference/typescript/ARCHITECTURE.md)、[authentication と token](../../reference/typescript/AUTH-AND-TOKENS.md)、[Extension](../../reference/typescript/EXTENSIONS.md)、[WAM](../../reference/typescript/WAM.md)
- [Go reference](../../reference/go/README.md): Function、server、authentication と token、Extension、native Function、WAM integration
