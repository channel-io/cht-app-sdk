# Messaging Extension

Messaging은 inbox와 prebuilt message flow 및 관련 follow-up, medium-link, CHX registration을
포함합니다. AppStore contract 의존성이 높은 advanced family이므로 구현 전 subfamily contract와
native claim을 확정합니다.

TypeScript는 호환성을 위해 registration name으로 `messenger`와 `messaging`을 모두 허용하지만 typed
Function contract는 `extension.messaging.*`를 사용합니다. Go는 `messaging:v1`을 선언합니다.
`messenger`를 19번째 schema family로 보거나 Function 이름을 `extension.messenger.*`로 바꾸지 말고,
선택한 subfamily에 필요한 AppStore registration을 확인합니다.

## 계약

공개 SDK는 typed `extension.messaging.inbox.*`와 `extension.messaging.prebuilt.*` Function을
제공합니다. 선택한 subfamily만 `MessagingFunctionNames`의 정확한 이름으로 구현합니다. AppStore가
여러 messaging registration을 별도로 관리하므로 generic `messaging:v1` 등록만으로 rollout이 끝나지
않을 수 있습니다.

Inbox Function:

- `extension.messaging.inbox.onMediumMessageCreated`
- `extension.messaging.inbox.onMediumUserChatClosed`
- `extension.messaging.inbox.getWritingTypes`
- `extension.messaging.inbox.getCustomEditorWam`
- `extension.messaging.inbox.getMediumTopicSelectorWam`
- `extension.messaging.inbox.getMediumMessageErrorReason`

Prebuilt Function:

- `extension.messaging.prebuilt.getWritingTypes`
- `extension.messaging.prebuilt.validateEntity`
- `extension.messaging.prebuilt.getCustomEditorWam`
- `extension.messaging.prebuilt.getMediumTopicBuilderSelectorWam`
- `extension.messaging.prebuilt.buildMediumTopics`
- `extension.messaging.prebuilt.getDefaultOptions`

## Registration·native claim

AppStore는 inbox, prebuilt, follow-up, medium-link, CHX app-level registration을 별도로 제공합니다.
현재 SDK는 generic `registerExtension`만 제공하므로 문서화되지 않은 method를 호출하지 말고 AppStore
rollout과 subfamily registration을 조율합니다.

Inbox runtime에는 channel-scoped `findOrCreateContactAndUser`,
`findOrCreateUserChatByMedium`, `submitHandlingWorkflowButton`, `findContactsByUser`,
`writeUserChatMessage`, `writeUserChatMessageAsUser`, `updateUserChatStateByUser`,
`startUserChatFromUserByMedium`이 필요할 수 있습니다. 이들은 app default가 아니라 channel-role
claim입니다. `submitHandlingWorkflowButton`은 공개 core DTO가 없어 request type이 의도적으로 열려
있으므로 DTO를 만들지 말고 해당 호출을 격리해 테스트합니다.

## TypeScript

Rollout에서 확인된 AppStore-compatible `messenger` 또는 `messaging` registration name과 공개
`extension.messaging.*` schema를 사용합니다. WAM Function은 canonical WAM result를 반환하고
channel/Core native call은 typed native contract를 사용합니다.
[TypeScript Messaging 레퍼런스](../../../reference/typescript/extensions/messaging.md)를 확인하세요.

## Go

```go
err := app.Use(messaging.Extension().
  InboxOnMediumMessageCreated(handler.OnMessage).
  InboxGetWritingTypes(handler.GetWritingTypes).
  InboxGetCustomEditorWAM(handler.GetEditor))
```

선택한 inbox 또는 prebuilt flow에 필요한 builder method만 추가합니다.

## 인증·WAM·신뢰성

- Channel-scoped native claim을 먼저 설계합니다. App token으로 manager/user를 대신하지 않습니다.
- 외부 conversation/message mapping을 저장하고 webhook·polling delivery를 idempotent하게 만듭니다.
- WAM argument를 최소화하고 server mutation은 독립적으로 다시 인가합니다.
- Writing type, editor/selector WAM, provider rejection mapping, duplicate message, closed chat,
  missing native claim, partial delivery를 테스트합니다.

[Go builder package와 messaging 예제](../../../reference/go-extensions.md#builder-packages)도 확인하세요.
