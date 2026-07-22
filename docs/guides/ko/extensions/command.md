# Command Extension

Desk 또는 front command로 text를 반환하거나 server action을 수행하거나 WAM을 열 때 사용합니다.

## 계약

| Function                                 | 필수 여부      | 역할                     |
| ---------------------------------------- | -------------- | ------------------------ |
| `extension.command.metadata.getCommands` | 필수           | Command definition 공개  |
| Metadata의 `actionFunctionName`          | Command별 필수 | 선택된 command 실행      |
| Metadata의 `autoCompleteFunctionName`    | 선택           | Argument suggestion 반환 |

Action과 autocomplete target은 공식 Extension contract가 아니라면 standalone 전체 Function
이름입니다. Metadata 이름과 discovery 결과가 정확히 같아야 합니다.

`commands`에는 최대 30개 definition을 넣을 수 있습니다. 각 command는 1-30자 name, `front` 또는
`desk` scope, `actionFunctionName`, `alfMode: "disable" | "recommend"`를 가집니다. 최대 10개의 typed
parameter(`string`, `float`, `int`, `bool`), static choice, localization map, autocomplete Function을
선택적으로 선언할 수 있습니다.

## TypeScript

`metadata.getCommands`에는 `@Extension({ name: "command", systemVersion: "v1" })`을, action에는
standalone `@Func("example.command.run")`을 사용합니다. Metadata는 `GetCommandsOutputSchema`, action
output은 `CommandResultSchema`로 검증합니다. [TypeScript Command 레퍼런스](../../../reference/typescript/extensions/command.md)와
[TypeScript 튜토리얼](https://github.com/channel-io/app-tutorial-ts)을 확인하세요.

## Go

```go
err := app.Use(command.Extension().
  GetCommands(handler.GetCommands).
  Suggestions("example.command.suggest", handler.Suggest).
  Execute("example.command.run", handler.Run))
```

## 인증·WAM·검증

- 상호작용 UI가 필요할 때만 WAM result를 반환하고 `wamArgs`에는 allowlist된 비밀이 아닌 context만
  넣습니다.
- Server 작업은 `useCallFunction`, 현재 사용자 권한 작업만 `useNativeFunction`을 사용합니다.
- Mutation command는 idempotent하게 만들고 중복 제출을 막으며 discovery, action, autocomplete를
  각각 테스트합니다.

[Go 튜토리얼](https://github.com/channel-io/app-tutorial)도 확인하세요.
