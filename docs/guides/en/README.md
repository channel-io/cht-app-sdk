# Channel App SDK Guides

These guides give Channel app developers one shared model for the TypeScript and Go SDKs.

## Recommended reading order

1. [Quickstart](quickstart.md): create a private app and run the Command, WAM, and message flows.
2. [Concepts](concepts.md): learn the Function, Extension, WAM, authentication, and token boundaries.
3. [Complete app development guide](app-development.md): design, secure, deploy, and operate the app.
4. [Function registration](functions.md): define standalone typed app Functions.
5. [Extension guide and 16 TypeScript/Go family recipes](extensions.md): select a capability and implement its contract.
6. Use the [TypeScript references](../../reference/typescript/ARCHITECTURE.md) or
   [Go reference](../../reference/go/README.md) for language-specific APIs.
7. Keep the [TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts) or
   [Go tutorial](https://github.com/channel-io/app-tutorial) open as a complete implementation.

## Choosing a SDK

Use the TypeScript SDK for NestJS, Zod, and WAM React development. Use the Go SDK for typed
functions, native calls, and extension helpers in a Go service.

The guides and public SDK exports define the current contract. The tutorials provide complete,
runnable implementations of that contract.

## Runnable examples

- [TypeScript app tutorial](https://github.com/channel-io/app-tutorial-ts)
- [Go app tutorial](https://github.com/channel-io/app-tutorial)

## Language references

- [TypeScript architecture](../../reference/typescript/ARCHITECTURE.md), [auth and tokens](../../reference/typescript/AUTH-AND-TOKENS.md), [Extensions](../../reference/typescript/EXTENSIONS.md), [WAM](../../reference/typescript/WAM.md)
- [Go reference](../../reference/go/README.md), including Functions, server, auth and tokens, Extensions, native Functions, and WAM integration
