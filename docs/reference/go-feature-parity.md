# Go Feature Parity

For task-oriented Go documentation, start with the [Go SDK Reference](go/README.md).

The Go SDK is intended to cover the TypeScript SDK's server-side app
development capabilities. The Go API uses builders, generics, structs, and
tags instead of TypeScript decorators and Zod, but the server-side SDK
responsibilities should be available at the same abstraction level.

## Current Coverage

| TypeScript SDK area          | Go SDK status | Go surface                                                                          |
| ---------------------------- | ------------- | ----------------------------------------------------------------------------------- |
| Core function contract       | Available     | `appsdk.FunctionRequest`, `appsdk.FunctionResponse`                                 |
| Simple function registration | Available     | `appsdk.App.Func`, `appsdk.Handle`                                                  |
| Input/output schemas         | Available     | Struct-derived schema, schema tags, explicit overrides                              |
| Extensible outputs           | Available     | `appsdk.WithExtraFields`, `appsdk.ExtensibleOutput`                                 |
| Function discovery           | Available     | `getFunctions` and `getTestFunctions` handling                                      |
| Native client                | Available     | `native.Client` token, extension, ALF, Notebook, data-table, and app-function calls |
| Token manager cache          | Available     | `native.TokenManager`, custom cache, refresh dedup                                  |
| Auto registration            | Available     | `native.AutoRegistrar`, `server.WithAutoRegister`                                   |
| Server bootstrap             | Available     | `server.Run`; `server/gin.NewServer`; `server/gin.NewRoute` for custom Gin mounting |
| Testing utilities            | Available     | `testkit.Call`, `Functions`, `TestFunctions`                                        |
| Signature handling           | Available     | `server/gin.WithSignature`                                                          |
| Extension helpers            | Available     | `extension/*` builders, including order/WMS/messaging, plus `extension.New`         |
| Generated proto DTOs         | Available     | Extension packages re-export generated DTOs directly or with `Proto*` aliases       |
| DataSource query server      | Available     | `io.channel.datasource.v1` gRPC plus BigQuery Storage/PostgreSQL Arrow executors    |
| DataSource metadata DTOs     | Available     | JSON-RPC DTOs plus `Proto*` aliases for common extension proto types                |

## Not Yet Covered

| TypeScript SDK area                          | Go direction                                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| NestJS decorators/modules                    | Not a direct Go concept; use builders and framework handlers                                                     |
| WAM React SDK                                | Browser/frontend-only; stays TypeScript                                                                          |
| CLI app scaffolding                          | Planned only if Go app templates become necessary                                                                |
| Full schema validation                       | Add validator integration and richer JSON Schema generation                                                      |
| Generic/typed Channel native-operation proxy | The public client does not yet expose the TypeScript `createProxyApi` equivalent or a generic native-call method |

The runnable [Go app tutorial](https://github.com/channel-io/app-tutorial) keeps token lifecycle in
`native.TokenManager` and isolates its one `writeGroupMessage` transport call in a small adapter.
Remove that adapter when a public Go native-operation API is released.

## Target

Go should eventually cover all server-side SDK responsibilities that make sense
for Go apps:

- typed function registration
- function discovery and schema publication
- AppStore native calls
- app token management and extension auto-registration
- zero-boilerplate server bootstrap plus Gin route mounting
- signature verification middleware for common routers
- test helpers
- extension helper packages

TypeScript-only frontend features such as WAM React hooks remain in the
TypeScript SDK.
