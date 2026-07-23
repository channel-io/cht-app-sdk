# Command Extension

Desk/front command から text を返す、server action を実行する、WAM を開く場合に使います。

## Contract

| Function                                 | 必須               | 役割                       |
| ---------------------------------------- | ------------------ | -------------------------- |
| `extension.command.metadata.getCommands` | 必須               | Command definition を公開  |
| Metadata の `actionFunctionName`         | Command ごとに必須 | 選択された command を実行  |
| Metadata の `autoCompleteFunctionName`   | 任意               | Argument suggestion を返す |

Action と autocomplete target は公式 Extension contract でない限り standalone の full Function
name です。Metadata の名前を discovery output と完全に一致させます。

`commands` には最大 30 definition を含められます。各 command は 1-30 文字の name、`front` または
`desk` scope、`actionFunctionName`、`alfMode: "disable" | "recommend"` を持ちます。最大 10 の
typed parameter（`string`、`float`、`int`、`bool`）、static choice、localization map、autocomplete
Function を任意で宣言できます。

## TypeScript

`metadata.getCommands` には `@Extension({ name: "command", systemVersion: "v1" })`、action には
standalone `@Func("example.command.run")` を使います。Metadata は `GetCommandsOutputSchema`、action
output は `CommandResultSchema` で検証します。[TypeScript Command reference](../../../reference/typescript/extensions/command.md)
と [TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts) を参照してください。

## Go

```go
err := app.Use(command.Extension().
  GetCommands(handler.GetCommands).
  Suggestions("example.command.suggest", handler.Suggest).
  Execute("example.command.run", handler.Run))
```

## 認証・WAM・検証

- Interactive UI が必要な場合だけ WAM result を返し、`wamArgs` には allowlist 済みの非 secret
  context だけを入れます。
- Server 処理には `useCallFunction`、current user の権限処理だけに `useNativeFunction` を使います。
- Mutation command を idempotent にし、重複 submit を防ぎ、discovery、action、autocomplete を
  別々に test します。

[Go tutorial](https://github.com/channel-io/app-tutorial) も参照してください。
