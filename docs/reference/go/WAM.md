# Go Server With WAM

WAM (Web App Module) is a browser UI loaded by a Channel client. The Go SDK returns the action that opens the UI; the UI itself uses the shared TypeScript/React package `@channel.io/app-sdk-wam`.

## Return A WAM Action

For a command handler:

```go
func openTutorial(appID string) appsdk.TypedHandlerFunc[
  command.ExecuteRequest,
  command.ActionResult,
] {
  return func(
    _ context.Context,
    fnCtx appsdk.Context,
    input *command.ExecuteRequest,
  ) (*command.ActionResult, error) {
    attributes, err := structpb.NewStruct(map[string]any{
      "appId": appID,
      "name":  "tutorial",
      "wamArgs": map[string]any{
        "view": "summary",
      },
    })
    if err != nil {
      return nil, err
    }
    return &command.ActionResult{Type: "wam", Attributes: attributes}, nil
  }
}
```

The action contains a public App ID, WAM name, and minimal client-readable arguments. Never include a secret, access token, provider credential, or raw customer record in `wamArgs`.

## Serve The Frontend

Register the WAM Endpoint root, for example:

```text
https://app.example.com/resource/wam
```

Serve the built SPA at `${WAM_ENDPOINT}/${name}`, such as `/resource/wam/tutorial`. The Go Function route and WAM static route are separate; mount the WAM directory explicitly on the selected HTTP server.

## React Runtime

Wrap the UI with `WamProvider` and use public hooks:

- `useWamData` / `useTypedWamData` for host context and `wamArgs`;
- `useCallFunction` for calls back to the Go app server;
- `useNativeFunction` for Channel operations authorized as the current manager/user;
- `useWamSize` and `useWamClose` for host UI control.

See the language-neutral [WAM SDK reference](../typescript/WAM.md) for the hook API.

## Authorization Boundary

- App/bot work: WAM calls a Go Function with `useCallFunction`; the handler obtains a channel token from `native.TokenManager`.
- Manager/user work: WAM calls `useNativeFunction`; the Channel host supplies and evaluates current-user authorization.

The Go server never sends App Secret, Signing Key, app token, or channel token to the WAM, and it does not mint manager/user authorization.

## Local Testing

A browser opened directly at the WAM URL does not provide the Channel host bridge. Test loading, runtime data, app Function calls, native Function calls, permission failures, resize, and close behavior inside an installed private app.

For a complete implementation, see the [Go tutorial](https://github.com/channel-io/app-tutorial).
