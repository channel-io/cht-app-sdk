# Messaging Extension

Messaging は inbox/prebuilt message flow と関連する follow-up、medium-link、CHX registration を
含みます。AppStore contract への依存が強い advanced family のため、実装前に subfamily contract
と native claim を確定します。

TypeScript は互換性のため registration name に `messenger` と `messaging` の両方を許可しますが、
typed Function contract は `extension.messaging.*` を使います。Go は `messaging:v1` を宣言します。
`messenger` を 19 番目の schema family と扱ったり Function name を `extension.messenger.*` に
変えたりせず、選択した subfamily に必要な AppStore registration を確認します。

## Contract

公開 SDK は typed `extension.messaging.inbox.*` と `extension.messaging.prebuilt.*` Function を
提供します。選択した subfamily だけを `MessagingFunctionNames` の正確な名前で実装します。
AppStore は複数の messaging registration を別々に管理するため、generic `messaging:v1` registration
だけで rollout が完了しない場合があります。

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

## Registration・native claim

AppStore は inbox、prebuilt、follow-up、medium-link、CHX の app-level registration を別々に
提供します。現在の SDK は generic `registerExtension` だけを提供するため、未公開 method を
呼ばず AppStore rollout と subfamily registration を調整します。

Inbox runtime では channel-scoped `findOrCreateContactAndUser`、
`findOrCreateUserChatByMedium`、`submitHandlingWorkflowButton`、`findContactsByUser`、
`writeUserChatMessage`、`writeUserChatMessageAsUser`、`updateUserChatStateByUser`、
`startUserChatFromUserByMedium` が必要になる場合があります。これらは app default ではなく
channel-role claim です。`submitHandlingWorkflowButton` は公開 core DTO がなく request type が
意図的に open なので、DTO を発明せず call を隔離して test します。

## TypeScript

Rollout で確認した AppStore-compatible `messenger` または `messaging` registration name と公開
`extension.messaging.*` schema を使います。WAM Function は canonical WAM result を返し、
channel/Core native call は typed native contract を使います。
[TypeScript Messaging reference](../../../reference/typescript/extensions/messaging.md) を参照してください。

## Go

```go
err := app.Use(messaging.Extension().
  InboxOnMediumMessageCreated(handler.OnMessage).
  InboxGetWritingTypes(handler.GetWritingTypes).
  InboxGetCustomEditorWAM(handler.GetEditor))
```

選択した inbox/prebuilt flow に必要な builder method だけを追加します。

## 認証・WAM・信頼性

- Channel-scoped native claim を先に設計します。App token で manager/user を代行しません。
- 外部 conversation/message mapping を保存し、webhook/polling delivery を idempotent にします。
- WAM argument を最小化し、server mutation は独立して再認可します。
- Writing type、editor/selector WAM、provider rejection mapping、duplicate message、closed chat、
  missing native claim、partial delivery を test します。

[Go builder package と messaging example](../../../reference/go-extensions.md#builder-packages) も参照してください。
