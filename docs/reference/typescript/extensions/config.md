# Config Extension

Use the config extension when your app needs a layout-aware setup surface that can store plain configuration values, sensitive credentials, or both.

This is the canonical successor to API key-only setup flows. It is designed to cover:

- grouped fields and sectioned layouts
- helper copy and descriptions
- dropdowns, multiselects, radios, checkboxes, switches, phone/address fields, and image inputs
- hook-aware setup flows where the schema can reference ordinary app functions

## Required Functions

- `extension.config.metadata.getConfigSchema`

## Optional Functions

- `extension.config.validation.validateStoredConfig`

## Registration

The canonical registration path is:

- `registerExtension("config", "v1")`

Legacy apps may still register `apikey`, but API key registration is deprecated for new apps. AppStore may internally normalize API key registrations into config-backed storage over time.

## Runtime Expectations

- AppStore resolves stored config into `ctx.config`
- sensitive values can still be projected into legacy `ctx.apiCredentials` for backward compatibility
- config setup WAMs should use public native functions for reading, saving, validating, and deleting scoped config values
- schema `hooks` may reference ordinary app functions such as `draftResolverFunctionName` and `validateFunctionName`
- these hook targets are ordinary app functions, not additional config extension functions

## Implementation Notes

- use `storageClass: "credential"` for encrypted or masked fields
- use `storageClass: "transient"` for draft-only values, such as images that a hook processes and clears before save
- use `storageClass: "media"` for image fields that should upload to the media server and persist only a media reference
- use `resolvesTo` when a transient input should produce a different stored config or credential key
- use `group` blocks to keep related inputs together
- `validateStoredConfig` should validate the already stored values, not raw request payloads
- use `hooks.draftResolverFunctionName` when field changes should derive additional draft values
  - AppStore standard WAM calls the referenced function with `{ scope, channelId, managerId?, changedFieldKey, changedValue, values }`
- use `hooks.validateFunctionName` when validation needs richer logic than declarative schema rules
  - AppStore backend calls the referenced function during stored config validation and passes the canonical values through `ctx.config`
- `validation.validateStoredConfig` remains the default fallback when `hooks.validateFunctionName` is omitted
- validation output may include `notices`
  - use `placement: "top"` for page-level banners
  - use `placement: "block"` with `blockId` to place a banner near a specific section/group/banner block
- assign stable `id` values to blocks when function-driven validation needs to target a specific place in the layout

## Image Storage

Image fields default to transient behavior unless `storageClass: "media"` is explicitly set. Media image fields are uploaded by AppStore's standard WAM, and function calls receive the parsed reference through `ctx.config`.

```json
{
  "brandLogo": {
    "type": "media",
    "key": "pub-file/...",
    "bucket": "channel-io-media",
    "url": "https://cf.channel.io/pub-file/...",
    "name": "logo.png",
    "contentType": "image/png",
    "size": 12345
  }
}
```

For image inputs that should not be stored but should produce a credential, combine `storageClass: "transient"` with `resolvesTo`.

```json
{
  "type": "image",
  "key": "otpQrImage",
  "label": "OTP QR image",
  "storageClass": "transient",
  "resolvesTo": {
    "key": "otpSecret",
    "storageClass": "credential",
    "sensitive": true,
    "maskType": "full"
  }
}
```

In this pattern, the draft resolver receives the image value, returns `valuesPatch.otpSecret`, and AppStore persists only `otpSecret`. The image remains draft-only.
