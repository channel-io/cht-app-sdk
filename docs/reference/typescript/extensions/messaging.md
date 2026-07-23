# Messaging Family

Messaging is still more AppStore-driven than most SDK extensions.

## Current State

- The SDK ships messaging v1 schemas and interfaces from `@channel.io/app-sdk-core`
- The SDK also exposes typed native-function contracts for the channel/Core API calls used by messaging integrations
- The decorator accepts `messenger` and `messaging` registration names for compatibility, while the
  typed Function prefix remains `extension.messaging.*`; never invent `extension.messenger.*`
- AppStore coordinates several messaging registrations separately:
  - inbox messaging
  - prebuilt messaging
  - follow-up
  - medium link
  - chx

That means you should implement messaging-family behavior with generic extension definitions and align the function names and native-function usage with the AppStore contract.

## App-Level Registration Claims

These app-level registrations are public defaults in AppStore today:

- `registerInboxMessagingExtension`
- `registerPrebuiltMessagingExtension`
- `registerFollowUpExtension`
- `registerMediumLinkExtension`
- `registerChxExtension`

In practice, the SDK still exposes only the generic `registerExtension()` method, so this area remains more AppStore-driven than other extensions.

## Inbox Messaging Runtime Claims

Inbox messaging also needs channel-scoped runtime native functions. The required set currently includes:

- `findOrCreateContactAndUser`
- `findOrCreateUserChatByMedium`
- `submitHandlingWorkflowButton`
- `findContactsByUser`
- `writeUserChatMessage`
- `writeUserChatMessageAsUser`
- `updateUserChatStateByUser`
- `startUserChatFromUserByMedium`

These are channel-role available claims, not app defaults. That is an intentional security boundary.
`submitHandlingWorkflowButton` is listed by AppStore as a required inbox messaging claim, but the inspected core API proto does not currently expose a request DTO for it; the SDK keeps its type intentionally open.

## Practical Guidance

- Treat messaging as an advanced integration
- Plan the native function surface first
- Keep registration and runtime behavior separate in your design
- Prefer documenting the exact AppStore contract next to your app code until the SDK grows a first-class helper
