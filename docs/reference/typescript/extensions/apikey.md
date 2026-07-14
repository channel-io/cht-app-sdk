# API Key Extension

> Deprecated for new apps. Prefer the [Config Extension](./config.md) for setup
> UI, credential fields, validation, and app-specific configuration. AppStore
> still accepts `registerExtension("apikey", "v1")` for backward compatibility
> and can normalize API key registrations into config-backed storage.

Use the API key extension when managers or channels should store provider credentials as key-value fields instead of going through OAuth.

## Required Functions

- `extension.apikey.metadata.getAuthConfig`
- `extension.apikey.validation.validateCredentials`

`validateCredentials` is optional in AppStore, but it is strongly recommended.

## Registration

Registration uses the generic path:

- `registerExtension("apikey", "v1")`

During registration, AppStore reads `metadata.getAuthConfig` and stores the credential field definition. New apps should register `config` instead.

## Runtime Native Functions

API key flows rely on manager-scoped native functions:

- `getExtensionSystemVersion`
- `getAPIKeyCredentials`
- `setAPIKeyCredentials`
- `deleteAPIKeyCredentials`

These functions are public defaults in AppStore today.

## Implementation Notes

- `authScope` in `getAuthConfig` decides whether the credential is channel- or manager-oriented
- `validateCredentials` runs against the stored credential values and should return a simple validity result
- If you build a WAM around API key setup, use `useNativeFunction()` for the credential operations and `useCallFunction()` for your own app logic
