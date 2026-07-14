# Partial Migration

Existing Go apps can adopt the SDK without moving every function at once. Use `compat/legacy.Composite` to combine the existing registry with the SDK registry.

```go
sdkApp := appsdk.New(appsdk.Options{AppID: appID})
sdkApp.Func("extension.new.method", appsdk.Handle(newHandler))

composite, err := legacy.NewComposite(
  sdkApp,
  legacy.Registry{
    "extension.old.method": oldHandler,
  },
  legacySchemaProvider,
)
```

Rules:

- Each method has exactly one owner: SDK or legacy.
- Duplicate methods fail at startup.
- The composite owns `extension.core.function.getFunctions` and merges SDK and legacy schemas.
- Missing methods return method not found without fallback probing.

an existing commerce app is the first target for this migration style.
