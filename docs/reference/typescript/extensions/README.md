# Extension Guide

This folder explains the extension contracts that the SDK can implement today.
All examples below assume the current public packages:

- `@channel.io/app-sdk-server`
- `@channel.io/app-sdk-wam`

## Current Recommendation

Use `createExtension()` and `defineFunction()` or the decorator API from `@channel.io/app-sdk-server`.
That is the most reliable path across the current extension set.

## Extension Matrix

| Extension        | How to implement it today                   | Registration path                                                          | Extra native functions after registration                                                              | Working reference                                                                    |
| ---------------- | ------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Config           | `createExtension()` or decorators           | `registerExtension("config", "v1")`                                        | config-scoped read/save/validate/delete helpers are expected to back setup WAMs                        | [config.md](./config.md)                                                             |
| Command          | `createExtension()` or decorators           | `registerExtension("command", "v1")`                                       | none in the SDK surface for normal execution                                                           | [command.md](./command.md), [examples/basic](../../examples/basic/README.md)         |
| OAuth            | `createExtension()` or decorators           | `registerExtension("oauth", "v1")`                                         | `getOAuthConfig`, `getOAuthConnection`, `getOAuthAuthorizationURL`, `disconnectOAuth`                  | [oauth.md](./oauth.md)                                                               |
| API key (legacy) | `createExtension()` or decorators           | `registerExtension("apikey", "v1")`                                        | `getExtensionSystemVersion`, `getAPIKeyCredentials`, `setAPIKeyCredentials`, `deleteAPIKeyCredentials` | [apikey.md](./apikey.md)                                                             |
| Calendar         | `createExtension()` or decorators           | `registerExtension("calendar", "v1")`                                      | usually none beyond app functions                                                                      | [calendar.md](./calendar.md), [examples/calendar](../../examples/calendar/README.md) |
| Widget           | `createExtension()` or decorators           | `registerExtension("widget", "v1")`                                        | none in normal widget runtime; widget install hooks are separate hook metadata                         | [widget.md](./widget.md)                                                             |
| Custom tab       | `createExtension()` or decorators           | `registerExtension("customtab", "v1")`                                     | none in normal runtime                                                                                 | [customtab.md](./customtab.md)                                                       |
| Hook             | `createExtension()` or decorators           | `registerExtension("hook", "v1")`                                          | no extra SDK helper; handlers are normal app functions                                                 | [hook.md](./hook.md)                                                                 |
| Mail relay       | `createExtension()` or decorators           | `registerExtension("mailRelay", "v1")`                                     | proxy forwards `{slug}.mail.channel.io` SES events to AppStore, which resolves and invokes the app function | [mail-relay.md](./mail-relay.md)                                                     |
| Polling          | `createExtension()` or decorators           | `registerExtension("polling", "v1")`                                       | target resolver returns channel pages; poller handlers are normal app functions                        | [polling.md](./polling.md)                                                           |
| Store            | `createStoreExtension()` or decorators      | `registerExtension("store", "v1")`                                         | none in normal runtime; AppStore reads the profile during registration/sync                            | [store.md](./store.md)                                                               |
| DataSource       | `createDataSourceExtension()` or decorators | `registerExtension("datasource", "v1")`                                    | query execution uses datasource gRPC; optional runners support PostgreSQL and BigQuery Storage + Arrow | [datasource.md](./datasource.md)                                                     |
| Messaging family | generic extension definitions only for now  | AppStore legacy registrations for inbox/prebuilt/follow-up/medium-link/chx | channel-scoped runtime native functions are required for inbox messaging                               | [messaging.md](./messaging.md)                                                       |
| ALF task         | `createExtension()` or decorators           | `registerExtension("alfTask", "v1")` plus task sync                        | `registerAlfTasks`, `getAlfTaskVersions`                                                               | [alf-task.md](./alf-task.md)                                                         |
| Notebook         | `createNotebookExtensionV1()` or decorators | `registerExtension("notebook", "v1")` plus notebook sync                   | `registerAppNotebooks`, `getAppNotebookVersions`                                                       | [notebook.md](./notebook.md)                                                         |

## Notes

- Command, widget, custom tab, hook, and polling are metadata-driven. AppStore reads their metadata functions during registration.
- Mail relay is proxy-driven at runtime: the app still registers an extension function, while the mail relay proxy owns SES/SNS parsing and slug routing.
- OAuth is an auth extension. API key is legacy/deprecated for new apps; prefer Config for setup UI, stored credentials, validation, and app-specific configuration.
- DataSource metadata is JSON-RPC; query execution is handled by the app server datasource gRPC endpoint. PostgreSQL, BigQuery, and Arrow packages are optional peer dependencies and are loaded only by the runner that uses them.
- Messaging is partially supported by extension names and generic function routing, but the SDK does not yet provide a bundled helper or example for the full flow.
- Notebook apps expose app-managed notebook definitions. AppStore owns extension registration and native proxying; cht-notebook owns notebook storage, revisioning, sync, and UI.
