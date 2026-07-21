# Go Extensions

An Extension is a named, system-versioned capability contract. In Go, a builder declares the Extension and registers its standard metadata and runtime Functions with `appsdk.App`.

## Typed Builder

```go
err := app.Use(command.Extension().
  GetCommands(command.StaticCommands(&command.Config{
    Name:               "hello",
    Scope:              command.ScopeDesk,
    ActionFunctionName: "tutorial.open",
    AlfMode:            command.AlfModeDisable,
    EnabledByDefault:   true,
  })).
  Execute("tutorial.open", openTutorial),
)
if err != nil {
  return err
}
```

This declares `command:v1`, registers `extension.command.metadata.getCommands`, and registers the standalone `tutorial.open` Function referenced by command metadata.

## Function Naming

- `ExtensionFunction("metadata.getCommands", ...)` becomes `extension.{extensionName}.metadata.getCommands`.
- `Function("tutorial.open", ...)` keeps the standalone full name.
- `extension.FullName(name, relativeName)` builds a canonical Extension Function name.

Use an Extension Function only when it is part of the registered standard contract. Keep app-specific business behavior standalone rather than inventing a Function group that AppStore does not understand.

## Builder Packages

| Extension             | Package                                                  |
| --------------------- | -------------------------------------------------------- |
| Config                | `extension/config`                                       |
| OAuth                 | `extension/oauth`                                        |
| API key compatibility | `extension/apikey`                                       |
| Command               | `extension/command`                                      |
| Widget                | `extension/widget`                                       |
| Custom tab            | `extension/customtab`                                    |
| Hook                  | `extension/hook`                                         |
| Polling               | `extension/polling`                                      |
| Calendar              | `extension/calendar`                                     |
| Store                 | `extension/store`                                        |
| DataSource            | `extension/datasource`                                   |
| Commerce/Order/WMS    | `extension/commerce`, `extension/order`, `extension/wms` |
| Messaging             | `extension/messaging`                                    |
| ALF task              | `extension/alftask`                                      |
| Notebook              | `extension/notebook`                                     |
| Mail relay            | `extension/mailrelay`                                    |
| Custom                | `extension`                                              |

Use the family builder and exported DTOs before the generic builder. The family package owns canonical names, schemas, validation, and protobuf JSON behavior.

## Generic Builder

Use `extension.New` when no typed family helper exists or when migrating an existing contract:

```go
custom := extension.New("custom", extension.SystemVersion("v1")).
  ExtensionFunc(
    "metadata.getProfile",
    appsdk.Input[extension.Empty](),
    appsdk.Output[Profile](),
    appsdk.Handle(extension.Static(Profile{})),
  ).
  Func(
    "custom.execute",
    appsdk.Input[ExecuteInput](),
    appsdk.Output[ExecuteOutput](),
    appsdk.Handle(execute),
  )

if err := app.Use(custom); err != nil {
  return err
}
```

Do not use a custom Extension name when a standard family already defines the product capability.

## Registration

`app.Use` calls the builder's `Register` method and records its name/system version. `server.WithAutoRegister()` obtains a cached app token and calls `registerExtension` for each recorded target after the listener starts.

Some families require a second sync step after generic registration:

- ALF task: `RegisterAlfTasks`
- Notebook: `RegisterAppNotebooks`
- DataSource: a separate authenticated gRPC query endpoint

Read the family package and [detailed Go Extension examples](../go-extensions.md) before implementing these flows.

## Proto And Schema Contracts

Standard Extension DTOs originate from shared protocol contracts. Import types from `extension/{family}`, not the internal generated package. Use proto registration helpers when the package exports generated message types. Use schema patches only for explicitly supported app-specific fields; never redefine an SDK-owned field with a different meaning.

## Testing

Test:

- declared Extension name and system version;
- canonical discovery Function names;
- metadata output and referenced standalone Function names;
- input/output schema publication;
- registration failure handling;
- family-specific validation and secondary sync.

Use `testkit.Functions` for discovery and call representative handlers through `testkit.Call`.
