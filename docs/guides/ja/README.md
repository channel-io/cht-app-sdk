# Channel App SDK ガイド

このガイドは、Channel アプリ開発者が TypeScript SDK と Go SDK を同じ考え方で使えるようにまとめたものです。

## ドキュメント

- [クイックスタート](quickstart.md)
- [基本概念](concepts.md)
- [Function 登録](functions.md)
- [部分移行](partial-migration.md)
- [WMS 拡張](extensions/wms.md)
- [Order 拡張（レガシー）](extensions/order.md)
- [Commerce 拡張](extensions/commerce.md)

## SDK の選び方

NestJS、Zod、WAM React 開発には TypeScript SDK が向いています。既存の Go サービスに typed function、native client、extension helper を段階的に入れる場合は Go SDK が向いています。
