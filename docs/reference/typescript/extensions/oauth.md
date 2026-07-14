# OAuth Extension

Use the OAuth extension when a channel or manager must connect a third-party account to a Channel app.

## Required Functions

Implement these function names:

- `extension.oauth.metadata.getAuthConfig`
- `extension.oauth.validation.validateCredentials`

`validateCredentials` is the contract AppStore expects for extension-based OAuth.

## Registration

Registration is still the generic extension flow:

- `registerExtension("oauth", "v1")`

During registration, AppStore reads your `getAuthConfig` result and stores provider metadata.

## `getAuthConfig` Output

Return the AppStore SSOT shape from `metadata.getAuthConfig`:

```typescript
import { OAuthConfigSchema, type OAuthConfig } from "@channel.io/app-sdk-core";

const config = {
  authType: "oauth",
  authScope: "channel",
  oauthProvider: {
    provider: "yahoo-shopping",
    authorizationUrl: "https://auth.login.yahoo.co.jp/yconnect/v2/authorization",
    tokenUrl: "https://auth.login.yahoo.co.jp/yconnect/v2/token",
    scopes: ["openid", "profile"],
    providerName: "Yahoo! Shopping",
    providerDescription: "Connect a Yahoo! Shopping store account.",
    parameterCase: "snake",
    authorizationOpenMode: "popup",
  },
} satisfies OAuthConfig;

OAuthConfigSchema.parse(config);
```

`authScope` is either `channel` for a shared channel connection or `manager`
for per-manager accounts. `oauthProvider.parameterCase` defaults to `snake`;
set it to `camel` only for providers that require camelCase OAuth standard
parameters.

`oauthProvider.authorizationOpenMode` defaults to `popup`. Set it to
`currentTab` only when the provider redirects to a full Desk/AppStore URL and
cannot reliably complete the popup close flow.

Do not return provider `clientId` or `clientSecret` from `getAuthConfig`.
AppStore stores client credentials separately through Desk OAuth credential
APIs/UI.

## Runtime Native Functions

Once the extension is registered, the manager experience depends on manager-scoped native functions that are now public defaults in AppStore:

- `getOAuthConfig`
- `getOAuthConnection`
- `getOAuthAuthorizationURL`
- `disconnectOAuth`

These are manager-level operations, not app-level registration calls.

## Implementation Notes

- Put provider configuration under `oauthProvider` in `metadata.getAuthConfig`
- Return only provider metadata there. Do not treat it as a token exchange handler
- `validateCredentials` is called by AppStore after token exchange with `ctx.authToken`
  populated and should return `{ valid: boolean }`
- In WAM or Desk surfaces, use `useNativeFunction()` only when the current role and surface expose the relevant manager native functions

## Reference

- [examples/calendar](../../examples/calendar/README.md)
