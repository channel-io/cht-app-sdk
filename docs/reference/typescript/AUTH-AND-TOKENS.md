# Auth And Tokens

This SDK has three layers that matter for authentication:

- `APP_SECRET`: your long-lived app credential
- access and refresh tokens: short-lived runtime credentials issued by AppStore native functions
- extension-native functions: operations such as `registerExtension`, OAuth connection management, or API key credential management

## Which Tool To Use

Use these entry points depending on what you are building:

| Use case                                | Recommended API              |
| --------------------------------------- | ---------------------------- |
| NestJS app with auto-registration       | `ChannelAppModule.forRoot()` |
| Explicit token lifecycle in server code | `TokenManager`               |
| Low-level native function calls         | `NativeFunctionClient`       |
| Simple legacy registration client       | `AppStoreClient`             |
| Frontend WAM calling native functions   | `useNativeFunction()`        |

## Token Types

The server SDK supports app, channel, manager, and user tokens.

- App token: extension registration and other app-scoped native functions
- Channel token: channel-scoped native functions and proxy API calls
- Manager token: manager-scoped native functions such as OAuth or API key management
- User token: user-scoped native functions

## Issue And Refresh

`issueToken()` and `refreshToken()` share the same native function rate limit.
Because of that, app code should not call `issueToken()` repeatedly.

Use one of these cache paths instead:

- `TokenManager`
  - caches tokens per scope
  - refreshes before expiry
  - deduplicates concurrent refreshes
- `ChannelAppService`
  - used by NestJS auto-registration
  - caches one app token
  - refreshes first, falls back to `issueToken()`

## Caching Behavior

Today the SDK already has token caching.

- `TokenManager`
  - app, channel, manager, and user token support
  - in-memory cache by default
  - optional custom cache storage
  - refresh buffer
  - in-flight request deduplication
- `ChannelAppService`
  - app-level cache for auto-registration
  - uses refresh token before issuing a new pair

The one path that does not cache for you is direct repeated use of `NativeFunctionClient.issueToken()`.

## Registration Flow

The most common app bootstrap flow is:

1. Start NestJS with `ChannelAppModule.forRoot(...)`
2. Enable `autoRegister`
3. Let `ChannelAppService` fetch and cache an app token
4. Let `NativeFunctionClient.registerExtension()` register each extension
5. Let AppStore call back into your app and read metadata functions

## Extension-Specific Native Functions

Some extensions need more than generic registration:

| Extension        | Native functions you will usually care about                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| OAuth            | `registerExtension`, `getOAuthConfig`, `getOAuthConnection`, `getOAuthAuthorizationURL`, `disconnectOAuth`                  |
| API key (legacy) | `registerExtension`, `getExtensionSystemVersion`, `getAPIKeyCredentials`, `setAPIKeyCredentials`, `deleteAPIKeyCredentials` |
| ALF task         | `registerExtension`, `registerAlfTasks`, `getAlfTaskVersions`                                                               |
| Notebook         | `registerExtension`, `registerAppNotebooks`, `getAppNotebookVersions`                                                       |
| Messaging family | registration claims plus channel-scoped runtime native functions. See [extensions/messaging.md](./extensions/messaging.md)  |

## WAM And Tokens

WAM code usually does not issue tokens directly.
Instead it runs inside Desk or another Channel surface and calls:

- your own app functions through `useCallFunction()`
- native functions through `useNativeFunction()`

That means token acquisition is usually a server concern, while WAM focuses on allowed runtime actions for the current surface and role.
