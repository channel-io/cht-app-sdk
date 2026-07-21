# Go Native Functions

Native Functions run in the opposite direction from app Functions: the Go app server asks AppStore or Channel to perform a platform-owned operation.

## Client Setup

```go
client := native.NewClient(
  native.WithHTTPClient(&http.Client{Timeout: 15 * time.Second}),
)
tokens := native.NewTokenManager(native.TokenManagerConfig{
  AppID:     appID,
  AppSecret: appSecret,
  Client:    client,
})
```

Use the default AppStore URL unless the target environment explicitly supplies another public base URL. Inject an `http.Client` with deadlines, tracing, and transport policy appropriate for the deployment.

## Public Typed Operations

The current Go client exposes typed methods for:

- `IssueToken` and `RefreshToken`;
- `RegisterExtension` and `UnregisterExtension`;
- `RegisterAlfTasks` and `GetAlfTaskVersions`;
- `RegisterAppNotebooks` and `GetAppNotebookVersions`;
- app data-table creation, schema, lookup, and row ingestion;
- `CallAppFunction` for calling a registered app Function through AppStore.

Check the exported `native.Client` methods for the exact current surface. Do not copy an undocumented method name into application code.

## Token Scope

Obtain the token required by the operation:

```go
appToken, err := tokens.GetAppToken(ctx)
if err != nil {
  return err
}

result, err := client.RegisterExtension(
  ctx,
  appToken.AccessToken,
  appID,
  "command",
  "v1",
)
```

Use app tokens for app-owned registration and data operations. Server-side Channel operations require a channel token for the installed Channel. Never pass the App Secret as an access token.

## App Function Calls

`CallAppFunction` invokes another registered app Function through AppStore. It accepts an access token, app ID, method, params, Function context, and system version, and returns raw JSON for the caller to decode.

It is not a generic Channel native-operation method. Do not use it to call arbitrary native method names.

## Current Proxy Gap

The public Go client does not yet expose TypeScript's `createProxyApi` equivalent or a generic typed Channel-operation proxy. Before a server-side Channel operation:

1. check [Go Feature Parity](../go-feature-parity.md);
2. prefer an exported typed method if one exists;
3. if the public contract is documented but no wrapper exists, isolate one method in a small transport adapter;
4. test its URL, method name, token header, request, response, timeout, and error handling;
5. remove the adapter when the SDK adds a public wrapper.

Do not grow a second general-purpose native client inside an app.

## Errors And Logging

The client returns errors for transport failures, non-success status, response decoding, and Function error envelopes. Wrap errors with operation context, but do not log request bodies, access/refresh tokens, provider credentials, or customer data.

## Testing

Use `native.WithHTTPClient` and a controlled test server to verify:

- request path and `PUT` method;
- `Content-Type` and `x-access-token` behavior;
- camelCase payload fields;
- Function error and non-2xx handling;
- context cancellation and timeouts.
