# Channel.io App SDK Agent Guide

This repository is meant to be usable without external developer docs.
If you are building or reviewing a Channel.io app, start from the files below in this order.

## Start Here

1. [README.md](./README.md)
2. [docs/reference/typescript/AUTH-AND-TOKENS.md](./docs/reference/typescript/AUTH-AND-TOKENS.md)
3. [docs/reference/typescript/extensions/README.md](./docs/reference/typescript/extensions/README.md)
4. [docs/reference/typescript/WAM.md](./docs/reference/typescript/WAM.md)
5. Examples:
   - [ts/examples/basic/README.md](./ts/examples/basic/README.md)
   - [ts/examples/calendar/README.md](./ts/examples/calendar/README.md)

## Source Of Truth

When documentation and examples disagree, trust the code in this order:

1. Public package exports
   - [ts/packages/core/src/index.ts](./ts/packages/core/src/index.ts)
   - [ts/packages/server/src/index.ts](./ts/packages/server/src/index.ts)
   - [ts/packages/wam/src/index.ts](./ts/packages/wam/src/index.ts)
2. Extension schemas and interfaces
   - [ts/packages/core/src/extensions](./ts/packages/core/src/extensions)
   - [ts/packages/core/src/extensions/interfaces](./ts/packages/core/src/extensions/interfaces)
3. Registration and token flow
   - [ts/packages/server/src/native/client.ts](./ts/packages/server/src/native/client.ts)
   - [ts/packages/server/src/token/manager.ts](./ts/packages/server/src/token/manager.ts)
   - [ts/packages/server/src/nestjs/channel-app.service.ts](./ts/packages/server/src/nestjs/channel-app.service.ts)
4. WAM runtime behavior
   - [ts/packages/wam/src/hooks](./ts/packages/wam/src/hooks)
   - [ts/packages/wam/src/components](./ts/packages/wam/src/components)

## Recommended Build Path

- Server extensions:
  Use `createExtension()` and `defineFunction()` from `@channel.io/app-sdk-server`, or decorators from the same package.
- Auto-registration:
  Use `ChannelAppModule.forRoot({ autoRegister: true, extensions: [...] })` for NestJS apps.
- Token lifecycle:
  Use `TokenManager` or `ChannelAppService`'s built-in cache. Do not call `issueToken()` on every request.
- WAM:
  Use `@channel.io/app-sdk-wam` and return WAM action payloads from command, widget, or custom tab handlers.

## Important Current Caveats

- `create --template` in the CLI currently accepts a template name, but the generated starter is effectively the same baseline app. If you need a real working reference, use the example apps first.
- `add extension` scaffolding exists for several extensions, but some templates still lag the current exported API surface.
- The SDK does not yet ship a first-class messaging helper package or example. For messaging-family extensions, use generic extension definitions and the app-store contracts documented in [docs/reference/typescript/extensions/messaging.md](./docs/reference/typescript/extensions/messaging.md).
- OAuth, API key, and ALF task flows depend on native functions in addition to extension registration. Read the extension-specific docs before implementing them.

## Doc Map

- Auth and token flow: [docs/reference/typescript/AUTH-AND-TOKENS.md](./docs/reference/typescript/AUTH-AND-TOKENS.md)
- Extension overview: [docs/reference/typescript/extensions/README.md](./docs/reference/typescript/extensions/README.md)
- Command: [docs/reference/typescript/extensions/command.md](./docs/reference/typescript/extensions/command.md)
- OAuth: [docs/reference/typescript/extensions/oauth.md](./docs/reference/typescript/extensions/oauth.md)
- API Key: [docs/reference/typescript/extensions/apikey.md](./docs/reference/typescript/extensions/apikey.md)
- Calendar: [docs/reference/typescript/extensions/calendar.md](./docs/reference/typescript/extensions/calendar.md)
- Widget: [docs/reference/typescript/extensions/widget.md](./docs/reference/typescript/extensions/widget.md)
- Custom tab: [docs/reference/typescript/extensions/customtab.md](./docs/reference/typescript/extensions/customtab.md)
- Hook: [docs/reference/typescript/extensions/hook.md](./docs/reference/typescript/extensions/hook.md)
- Messaging family: [docs/reference/typescript/extensions/messaging.md](./docs/reference/typescript/extensions/messaging.md)
- ALF task: [docs/reference/typescript/extensions/alf-task.md](./docs/reference/typescript/extensions/alf-task.md)
- WAM: [docs/reference/typescript/WAM.md](./docs/reference/typescript/WAM.md)
