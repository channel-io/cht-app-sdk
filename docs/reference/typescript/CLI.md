# CLI

The CLI is helpful for scaffolding, but it is not yet the best source of truth for extension contracts.
Use [AGENT.md](../../../AGENT.md), the extension guides, and the example apps first.

## Current Reality

- `create <app-name>` works and produces a usable starter
- `--template` is accepted, but the generated starter is still effectively the same baseline app today
- `add extension` exists, but some templates lag the current exported API surface
- `add function` is not fully implemented yet

## Safe Commands

```bash
npx @channel.io/app-sdk create my-app
npx @channel.io/app-sdk add extension config
npx @channel.io/app-sdk add extension oauth
npx @channel.io/app-sdk add extension calendar
npx @channel.io/app-sdk add extension command
npx @channel.io/app-sdk add extension widget
npx @channel.io/app-sdk add extension customtab
npx @channel.io/app-sdk add extension hook
npx @channel.io/app-sdk add extension polling
npx @channel.io/app-sdk add extension store
npx @channel.io/app-sdk add extension alftask
```

## What To Trust More Than The CLI

- [ts/examples/basic](../../../ts/examples/basic/README.md)
- [ts/examples/calendar](../../../ts/examples/calendar/README.md)
- [docs/reference/typescript/extensions/README.md](./extensions/README.md)
- [docs/reference/typescript/WAM.md](./WAM.md)
- [docs/reference/typescript/AUTH-AND-TOKENS.md](./AUTH-AND-TOKENS.md)

## Recommendation

If you are starting a serious app:

1. scaffold once with `create`
2. copy patterns from the example apps
3. wire extensions with `@channel.io/app-sdk-server`
4. treat generated code as a convenience, not the contract
