# Messaging Extension

Messaging covers inbox and prebuilt message flows plus related follow-up, medium-link, and CHX
registrations. It is an advanced, AppStore-driven family; confirm the exact subfamily contract and
native claims before implementation.

TypeScript accepts both `messenger` and `messaging` as registration names for compatibility, while
the typed Function contract uses `extension.messaging.*`. Go declares `messaging:v1`. Do not treat
`messenger` as a nineteenth schema family or rewrite Function names to `extension.messenger.*`;
confirm the AppStore registration expected by the selected legacy/new rollout.

## Contract

The public SDK exposes typed `extension.messaging.inbox.*` and
`extension.messaging.prebuilt.*` Functions. Implement only the selected subfamily, using the exact
Function names from `MessagingFunctionNames`. AppStore still represents several messaging
registrations separately, so generic `messaging:v1` registration alone may not complete rollout.

Inbox Functions:

- `extension.messaging.inbox.onMediumMessageCreated`
- `extension.messaging.inbox.onMediumUserChatClosed`
- `extension.messaging.inbox.getWritingTypes`
- `extension.messaging.inbox.getCustomEditorWam`
- `extension.messaging.inbox.getMediumTopicSelectorWam`
- `extension.messaging.inbox.getMediumMessageErrorReason`

Prebuilt Functions:

- `extension.messaging.prebuilt.getWritingTypes`
- `extension.messaging.prebuilt.validateEntity`
- `extension.messaging.prebuilt.getCustomEditorWam`
- `extension.messaging.prebuilt.getMediumTopicBuilderSelectorWam`
- `extension.messaging.prebuilt.buildMediumTopics`
- `extension.messaging.prebuilt.getDefaultOptions`

## Registration and native claims

AppStore exposes separate app-level registrations for inbox, prebuilt, follow-up, medium-link, and
CHX. The current SDK offers generic `registerExtension`, so coordinate these subfamily registrations
with the AppStore rollout rather than calling undocumented methods.

Inbox runtime may require channel-scoped `findOrCreateContactAndUser`,
`findOrCreateUserChatByMedium`, `submitHandlingWorkflowButton`, `findContactsByUser`,
`writeUserChatMessage`, `writeUserChatMessageAsUser`, `updateUserChatStateByUser`, and
`startUserChatFromUserByMedium`. These are channel-role claims, not app defaults.
`submitHandlingWorkflowButton` currently has an intentionally open request type because no public
core DTO is exposed; isolate and test that call instead of inventing a DTO.

## TypeScript

Use the AppStore-compatible `messenger` or `messaging` registration name confirmed for the rollout
with the exported `extension.messaging.*` schemas.
WAM-returning Functions must return the canonical WAM result, and channel/Core native calls must use
the typed native contracts. See the [TypeScript Messaging reference](../../../reference/typescript/extensions/messaging.md).

## Go

```go
err := app.Use(messaging.Extension().
  InboxOnMediumMessageCreated(handler.OnMessage).
  InboxGetWritingTypes(handler.GetWritingTypes).
  InboxGetCustomEditorWAM(handler.GetEditor))
```

Add only the builder methods required by the chosen inbox or prebuilt flow.

## Authentication, WAM, and reliability

- Design channel-scoped native claims first. Never impersonate a manager or user with an app token.
- Persist provider conversation/message mappings and make webhook or polling delivery idempotent.
- Keep WAM arguments minimal and re-authorize server mutations independently.
- Test every declared writing type, editor/selector WAM, provider rejection mapping, duplicate
  message, closed chat, missing native claim, and partial delivery.

See the [Go builder packages and messaging example](../../../reference/go-extensions.md#builder-packages).
