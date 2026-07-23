# Command Extension

Use Command for Desk or front commands that return text, perform a server action, or open a WAM.

## Contract

| Function                                 | Requirement | Purpose                       |
| ---------------------------------------- | ----------- | ----------------------------- |
| `extension.command.metadata.getCommands` | Required    | Publishes command definitions |
| Metadata's `actionFunctionName`          | Per command | Runs the selected command     |
| Metadata's `autoCompleteFunctionName`    | Optional    | Returns argument suggestions  |

Action and autocomplete targets are ordinary full Function names unless they are part of an
official Extension contract. Keep the names in metadata identical to discovery output.

`commands` accepts up to 30 definitions. Each command has a 1-30 character name, `front` or `desk`
scope, `actionFunctionName`, and `alfMode: "disable" | "recommend"`. It may define up to 10 typed
parameters (`string`, `float`, `int`, or `bool`), static choices, localization maps, and an
autocomplete Function.

## TypeScript

Use `@Extension({ name: "command", systemVersion: "v1" })` for
`metadata.getCommands` and a standalone `@Func("example.command.run")` for the action. Validate
metadata with `GetCommandsOutputSchema` and action output with `CommandResultSchema`. See the
[TypeScript Command reference](../../../reference/typescript/extensions/command.md) and the
[TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts).

## Go

```go
err := app.Use(command.Extension().
  GetCommands(handler.GetCommands).
  Suggestions("example.command.suggest", handler.Suggest).
  Execute("example.command.run", handler.Run))
```

## Authentication, WAM, and reliability

- Return a WAM result only when interactive UI is needed; put only allowlisted, non-secret context
  in `wamArgs`.
- Use `useCallFunction` for server work and `useNativeFunction` only for authorized current-user
  operations.
- Make mutation commands idempotent, disable duplicate WAM submission, and test discovery separately
  from action execution and autocomplete.

See the [Go tutorial](https://github.com/channel-io/app-tutorial).
