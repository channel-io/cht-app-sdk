# 部分移行

既存の Go アプリは、すべての function を一度に SDK へ移行する必要はありません。`compat/legacy.Composite` で既存 registry と SDK registry を併用できます。

```go
sdkApp := appsdk.New(appsdk.Options{AppID: appID})
sdkApp.Func("extension.new.method", appsdk.Handle(newHandler))

composite, err := legacy.NewComposite(
  sdkApp,
  legacy.Registry{
    "extension.old.method": oldHandler,
  },
  legacySchemaProvider,
)
```

ルール:

- 1 つの method の owner は SDK または legacy のどちらかです。
- 重複 method は起動時に失敗します。
- `extension.core.function.getFunctions` は composite が SDK と legacy schema を結合して応答します。
- 存在しない method は fallback 探索をせず method not found を返します。

an existing commerce app はこの方式で function を 1 つずつ移行する最初の対象です。
