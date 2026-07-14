# Native Functions

Native functions are AppStore-hosted operations called by app servers.

The Go SDK exposes them through `native.Client`:

```go
client := native.NewClient()
token, err := client.IssueToken(ctx, appSecret)
```

For repeated server-side token use, prefer `native.TokenManager`. It mirrors the
TypeScript server SDK token layer:

```go
manager := native.NewTokenManager(native.TokenManagerConfig{
  AppID:     appID,
  AppSecret: appSecret,
})

token, err := manager.GetAppToken(ctx)
channelToken, err := manager.GetChannelToken(ctx, channelID)
```

`TokenManager` caches app and channel tokens, refreshes before expiry,
deduplicates concurrent requests for the same scope, and accepts a custom
`TokenCache` implementation for Redis or database-backed deployments.

Initial supported operations:

- `issueToken`
- `refreshToken`
- `registerExtension`
- `unregisterExtension`
- `registerAlfTasks`
- `getAlfTaskVersions`
- `registerAppNotebooks`
- `getAppNotebookVersions`
- `createAppDataTable`
- `createAppDataTableSchema`
- `getAppDataTableSchema`
- `upsertAppDataTableRows`
- app function proxy calls through `/general/v1/apps/{appId}/functions`

AppDataTable functions follow AppStore public native function scopes and should
use an app-scoped access token. `createAppDataTableSchema`,
`getAppDataTableSchema`, and `upsertAppDataTableRows` still require `channelId`
as a tenant data field, but AppStore authorizes them with the caller app's
`appId`; `channelId` is not a channel RBAC scope requirement for these
functions. Dataset/project identifiers are intentionally not part of the SDK
contract; AppStore/Core resolve app-owned BigQuery resources from `appId`.

App Notebook functions follow the ALF task pattern. Use an app-scoped access
token, register the `notebook` extension, then call `registerAppNotebooks` to
ask cht-notebook to sync notebooks from the app server. Use
`getAppNotebookVersions` to inspect the latest synced versions.

The SDK also exports native function schemas:

- TypeScript: `getNativeFunctionSchemas()` from `@channel.io/app-sdk-core` or
  `@channel.io/app-sdk-server`
- Go: `native.AppDataTableFunctionSchemas()` and
  `native.AppNotebookFunctionSchemas()`

The client keeps the transport shape compatible with the TypeScript server SDK:
HTTP `PUT`, JSON body with `method` and `params`, and `x-access-token` for
authenticated native calls.
