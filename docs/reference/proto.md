# Proto Contracts

`proto/` is the cross-language contract source for the SDK.

Current package:

```text
channel.app.sdk.v1
```

Current contract areas:

- `context.proto`: function context, caller, channel, user, and user chat data
- `function.proto`: function request, response, discovery, and schemas
- `error.proto`: function error envelope
- `native.proto`: AppStore native function request and response contracts
- `common.proto`: shared SDK/domain models such as channel messages, users, user chats, WAM results, and availability reasons
- `extension.proto`: server-side extension DTOs and function input/output envelopes across extension families, including API key, config, OAuth, calendar, command, widget, custom tab, hook, polling, store, notebook, order, WMS, messaging, and ALF task

Generated code is an implementation detail. App developers should normally use
the ergonomic TypeScript and Go SDK APIs instead of generated proto structs
directly. Shared DTO families should be defined in `common.proto` first. An
extension contract should compose those common models into concrete function
input/output envelopes in `extension.proto`. New server-side extension DTOs
should not be introduced only in a language package; add them to proto first,
regenerate Go/TypeScript, then wrap or alias the generated types from the
language SDK.

The TypeScript SDK also ships proto-generated Zod schemas. They are exported
from `@channel.io/app-sdk-core` as namespaces such as
`ProtoExtensionSchemas`, `ProtoCommonSchemas`, and `ProtoDatasourceSchemas`.
These generated schemas are the base runtime representation of proto contracts;
the higher-level TypeScript extension schemas can compose or mirror them with
SDK-specific validation such as defaults, discriminated unions, refinements, and
passthrough behavior.

In Go, generated extension DTOs are made available from their family package.
Proto-native packages such as `extension/order`, `extension/wms`, and
`extension/messaging` expose generated DTOs under ergonomic names. Packages that
already had hand-written structs expose generated DTOs with `Proto*` aliases so
existing callers can keep compiling while new apps can opt into proto-backed
types.

See [Go feature parity](go-feature-parity.md) for the current Go SDK coverage
against the TypeScript SDK surface.
