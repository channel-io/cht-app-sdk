# Legacy Web Documentation Notes

Reviewed against the App category and its child articles on 2026-07-21. The web articles remain useful for product concepts and wire-level reference, but the SDK and current tutorial repositories are the implementation source of truth.

| Older article/tutorial guidance                                              | Current guidance                                                                                                                                                 |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manually call `issueToken`, store access/refresh tokens, and calculate TTLs. | Use TypeScript or Go `TokenManager`; it caches, refreshes early, and deduplicates concurrent requests.                                                           |
| Call `registerCommands` once at startup with an app token.                   | Declare the `command` extension, expose `extension.command.metadata.getCommands`, and auto-register it through `registerExtension`.                              |
| Implement a separate unversioned `PUT /functions` dispatcher.                | SDK servers expose `PUT /functions/:version`; configure the `/functions` root in the portal and map bare root calls to the default SDK handler at ingress.       |
| Parse every request and dispatch `method` with a switch statement.           | Register typed functions through decorators/builders; the SDK owns dispatch and schema discovery.                                                                |
| Implement HMAC comparison directly in each tutorial.                         | Use the SDK signature guard/server option and preserve exact raw request bytes.                                                                                  |
| Write a custom wrapper around `window.ChannelIOWam`.                         | Use `WamProvider`, `useWamData`, `useCallFunction`, `useNativeFunction`, `useWamSize`, and `useWamClose`.                                                        |
| Read command values from inconsistent `params.inputs` examples.              | Current command input uses `params.input`, with `chat`, `trigger`, and optional `language` alongside it.                                                         |
| Use Go 1.21 and the old tutorial's custom Fx/token/cache stack.              | Use Go 1.25 and Go SDK `v0.14.0`; the current tutorial uses the SDK registry, command builder, token manager, server, signature verifier, and auto-registration. |
| Use raw Axios/Resty clients as the primary TypeScript/Go architecture.       | Use SDK clients and helpers first; add a small protocol adapter only where the language's feature-parity document identifies a missing wrapper.                  |
| Hard-code an AppStore URL in application code.                               | Prefer an environment-provided `APP_STORE_URL`; use the SDK default only for standalone apps and never copy a deployment-specific URL.                           |
| Reuse a project generator's development-only WAM transport in production.    | Use public `@channel.io/app-sdk-wam` hooks in the Channel client; local preview behavior may differ from the production host.                                    |
| Follow old GitHub links to handlers that encode the protocol manually.       | Follow the current TypeScript and Go tutorial READMEs, which link back to these SDK guides.                                                                      |

Additional SDK documentation issues corrected during this review:

- the public TypeScript handler context is `Context`, not `FunctionContext`;
- `TokenManager` manages app and channel tokens, not manager/user tokens;
- example logs now identify `PUT /functions/:version`, not `POST /functions`;
- the Go quickstart now points to `v0.14.0` instead of `v0.8.3`.

Re-review this page whenever extension registration, endpoint versioning, token scope support, or Go native-client parity changes.
