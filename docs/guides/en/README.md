# Channel App SDK Guides

These guides give Channel app developers one shared model for the TypeScript and Go SDKs.

## Documents

- [Concepts](concepts.md)
- [Quickstart](quickstart.md)
- [Complete app development guide](app-development.md)
- [Legacy web documentation notes](legacy-documentation-notes.md)
- [Function registration](functions.md)
- [Partial migration](partial-migration.md)
- [WMS extension](extensions/wms.md)
- [Order extension (legacy)](extensions/order.md)
- [Commerce extension](extensions/commerce.md)

## Choosing a SDK

Use the TypeScript SDK for NestJS, Zod, and WAM React development. Use the Go SDK when an existing Go service wants typed functions, native calls, and extension helpers without migrating everything at once.

When a web article, tutorial, and SDK example disagree, use the public SDK exports first, then the SDK reference and current tutorial repositories.

## Runnable examples

- [TypeScript app tutorial](https://github.com/channel-io/app-tutorial-ts)
- [Go app tutorial](https://github.com/channel-io/app-tutorial)

## Language references

- [TypeScript architecture](../../reference/typescript/ARCHITECTURE.md), [auth and tokens](../../reference/typescript/AUTH-AND-TOKENS.md), [Extensions](../../reference/typescript/EXTENSIONS.md), [WAM](../../reference/typescript/WAM.md)
- [Go reference](../../reference/go/README.md), including Functions, server, auth and tokens, Extensions, native Functions, and WAM integration
