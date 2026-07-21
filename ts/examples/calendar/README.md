# Calendar TypeScript Example

A NestJS and React example for OAuth, calendar functions, and a booking WAM using current SDK decorators and schemas.

## Run

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Configure the app and OAuth credentials in `.env`. Keep credentials out of Git.

## Source map

- `apps/server/src/extensions/oauth.extension.ts`: OAuth metadata and validation functions
- `apps/server/src/extensions/calendar.extension.ts`: calendar and booking functions
- `apps/server/src/app.module.ts`: `ChannelAppModule` and extension providers
- `apps/wam/src`: booking UI using `@channel.io/app-sdk-wam`

Use the actual source files and [extension guides](../../../docs/reference/typescript/extensions/README.md) as the reference. Older generic `createExtension()` / `defineFunction()` snippets are not part of the current public exports.
