# API Key Extension (legacy)

> New apps should use [Config](config.md). Keep API key only while maintaining a compatible existing
> installation.

## Contract

| Function                                          | Requirement | Purpose                                     |
| ------------------------------------------------- | ----------- | ------------------------------------------- |
| `extension.apikey.metadata.getAuthConfig`         | Required    | Declares legacy credential fields and scope |
| `extension.apikey.validation.validateCredentials` | Recommended | Validates stored credentials                |

Register `apikey:v1`. Never expose stored values through an app Function, logs, WAM data, or
`wamArgs`.

## TypeScript

Implement the deprecated `ApiKeyExtensionInterface` with `@Extension({ name: "apikey" })` and the
exported API key schemas. A setup WAM uses manager-scoped native credential operations; ordinary
provider calls stay on the server. See the [TypeScript API key reference](../../../reference/typescript/extensions/apikey.md).

## Go

```go
err := app.Use(apikey.Extension().
  GetAuthConfig(handler.GetAuthConfig).
  ValidateCredentials(handler.ValidateCredentials))
```

Use `extension/apikey` only for compatibility. Plan a migration that recreates the fields with
Config, verifies saved values, and removes the legacy registration only after installed channels
have moved.

## Verification

- Test channel/manager scope, masking, invalid credentials, deletion, and migration rollback.
- Do not retry a provider mutation merely because credential validation failed.
- Confirm the app requests only the native credential permissions required by the setup surface.

See the [Go Extension reference](../../../reference/go/EXTENSIONS.md).
