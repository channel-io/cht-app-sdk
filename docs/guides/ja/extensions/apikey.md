# API Key Extension（legacy）

> 新規アプリでは [Config](config.md) を使います。既存 installation との互換性が必要な間だけ
> API key を維持します。

## Contract

| Function                                          | 必須 | 役割                                    |
| ------------------------------------------------- | ---- | --------------------------------------- |
| `extension.apikey.metadata.getAuthConfig`         | 必須 | Legacy credential field と scope を宣言 |
| `extension.apikey.validation.validateCredentials` | 推奨 | 保存済み credential を検証              |

`apikey:v1` を登録します。保存値を app Function、log、WAM data、`wamArgs` に出しません。

## TypeScript

Deprecated `ApiKeyExtensionInterface` を `@Extension({ name: "apikey" })` と公開 API key schema で
実装します。設定 WAM は manager-scoped credential native operation を使い、provider call は
server が行います。[TypeScript API key reference](../../../reference/typescript/extensions/apikey.md)
を参照してください。

## Go

```go
err := app.Use(apikey.Extension().
  GetAuthConfig(handler.GetAuthConfig).
  ValidateCredentials(handler.ValidateCredentials))
```

`extension/apikey` は互換性用途に限定します。Config field へ移行し、保存値と installation の
移行を確認してから legacy registration を削除します。

## 検証

- Channel/manager scope、masking、invalid credential、削除、migration rollback を test します。
- Credential validation の失敗だけを理由に provider mutation を retry しません。
- 設定 surface に必要な最小 native credential permission だけを要求します。

[Go Extension reference](../../../reference/go/EXTENSIONS.md) も参照してください。
