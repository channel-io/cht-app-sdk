# Hook Extension

Use the hook extension when AppStore or Desk should call your app on lifecycle events.

## Required Function

- `extension.hook.metadata.getHooks`

Hook handlers themselves are plain app functions referenced by `actionFunctionName`.

## Supported Hook Types

Current SDK schema supports:

- `app.installed`
- `app.uninstalled`
- `command.toggle`
- `config.saved`
- `config.deleted`
- `widget.installed`
- `widget.uninstalled`
- `webhook.received`

Widget hooks must include a `targetId` that matches the widget name. App,
command, and config hooks must not include a `targetId`. Public webhook hooks
must include a public `targetId` that is 1-64 characters, starts with an
alphanumeric character, and otherwise contains only `A-Z`, `a-z`, `0-9`, `.`,
`_`, or `-`. They must also include a high-entropy
`webhook.endpointToken`. The `webhook` field is not allowed on other hook types.

## Public Webhook Ingress

Use `webhook.received` when an external service must call an app function without
resolving a Channel installation:

```ts
const endpointToken = process.env.WEBHOOK_ENDPOINT_TOKEN;
if (!endpointToken) throw new Error("WEBHOOK_ENDPOINT_TOKEN is required");

return {
  hooks: [
    {
      type: "webhook.received",
      targetId: "bcart.orders",
      actionFunctionName: "hooks.bcart.receive",
      systemVersion: "v1",
      webhook: { endpointToken },
    },
  ],
};
```

Generate the endpoint token with a cryptographically secure random generator. It
must contain 32-128 URL-safe characters (`A-Z`, `a-z`, `0-9`, `_`, or `-`). AppStore
stores only its SHA-256 hash.

After registration, providers send asynchronous `POST` requests to:

```text
https://app-store-api.channel.io/public/v1/apps/{appId}/hooks/{targetId}/{endpointToken}
```

AppStore returns `202 Accepted` and calls the configured ordinary app function
with the delivery ID, app ID, target ID, receive time, and original request. The
request includes headers, query parameters, parsed JSON body when available, and
`rawBodyBase64` for provider-specific signature verification. The call uses an
app-level context with no resolved Channel.

The v1 ingress does not support synchronous GET/body challenges or forwarding the
app function result to the provider response.

## Registration

Hooks register through:

- `registerExtension("hook", "v1")`

AppStore currently backs this with app-level install, command toggle, config
lifecycle, widget installation, and public webhook hook registrations.

## Good Fit

Use hooks for:

- app bootstrap and cleanup
- syncing external resources when the app is installed
- reacting to config save and delete lifecycle events
- reacting to command enable/disable
- provisioning resources when a specific widget is installed
- receiving external provider events without operating a separate webhook gateway
