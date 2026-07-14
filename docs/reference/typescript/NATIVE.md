# Native Functions

Native Functions are Channel-provided Functions.
A regular Function is an RPC exposed by an app server, while a Native Function is an RPC an app calls through AppStore to read or mutate Channel resources.

Official documentation: https://developers.channel.io/ko/articles/Function-77250b17

## Calling Native Functions

Native Functions are called through `PUT /general/v1/native/functions`.
The request body uses the same shape as regular Function calls.

```json
{
  "method": "writeUserChatMessage",
  "params": {}
}
```

Most Native Functions require `x-access-token`. Issue the token with `issueToken` or `TokenManager`, and pass the current access token at call time.

Successful responses include `result`; failed responses include `error`.

## SDK Structure

Native Function contracts are maintained as core types.

- Type map: `packages/core/src/types/native.ts`
- Root export: `packages/core/src/types/index.ts` -> `@channel.io/app-sdk-core`
- Transport client: `packages/server/src/native/client.ts`

Check `NativeFunctionTypeMap` in `packages/core/src/types/native.ts` for the modeled Native Functions.

`NativeFunctionClient` is transport-only. It does not run zod parsing at runtime; TypeScript infers params/result from the method string literal.

```ts
const result = await client.callNativeFunctionWithToken(
  "findOrCreateUserChatByMedium",
  params,
  accessToken,
);
```

AppDataTable functions are also modeled in the type map and schema exports. Use
an app-scoped token for all AppDataTable native functions. Functions that read
or write tenant data still require `channelId` as an input field, but AppStore
authorizes them against the caller app's `appId`; `channelId` is not a channel
RBAC scope requirement for these functions. The SDK only accepts logical `appId`,
`channelId`, `tableName`, schema columns, and rows; BigQuery project/dataset
names stay an AppStore/Core concern.

```ts
import { getNativeFunctionSchemas } from "@channel.io/app-sdk-server";

const schemas = getNativeFunctionSchemas();
```

## Updating Native Function Types

Treat the [official Native Functions documentation](https://developers.channel.io/ko/articles/Function-77250b17)
as the public source of truth. Keep request and response models limited to the
documented public contract, model proto `snake_case` fields as `camelCase` JSON
fields, and use `NativeOpaqueModel` when a result shape is intentionally open.
