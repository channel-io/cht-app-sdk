# Complete App Development Guide

This guide describes the current SDK-first path for a Channel App Store app. It replaces the main implementation path in the older App web articles, which show raw JSON-RPC, manual token caches, manual command registration, and direct `window.ChannelIOWam` calls.

Current versions verified on 2026-07-22:

- TypeScript server/core/WAM: `0.17.0`
- TypeScript WAM UI: `0.2.2`
- Go: `v0.13.14`
- Node.js: 20.11 or newer
- Go: 1.25

Do not copy a version from this page into automation without checking npm or Git tags first.

The notable TypeScript `0.17.0` addition is `webhook.received` hook metadata for app-level public webhook ingress. Before adding an arbitrary webhook route, read the [Hook extension reference](../../reference/typescript/extensions/hook.md) for its `targetId`, `endpointToken`, and asynchronous-delivery constraints.

If these terms are new, read [Concepts](concepts.md) first for the Function, Extension, WAM, and authentication boundaries. For complete runnable apps, use the [TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts) and [Go tutorial](https://github.com/channel-io/app-tutorial). This guide and the public SDK exports define the contract; the tutorials show server, WAM, and configuration working together.

## Recommended development method

Follow this sequence whether a builder creates the project or you implement it directly:

1. **Define the user outcome first.** Write down the job, where it runs (command, widget, custom tab, hook, or WAM), and the minimum Channel permissions it needs.
2. **Choose standard Extensions and Functions before coding.** Read the SDK extension schemas and standard function names. Do not invent a parallel protocol or alternate name for an existing contract.
3. **Implement only evidence-backed integrations.** Prefer an external provider's official API documentation. If no public API exists and browser automation is necessary, observe a reproducible user workflow; do not guess URLs, request schemas, or tenant values.
4. **Classify authentication correctly.** Use an OAuth extension and `ctx.authToken` for an Authorization Code flow. Treat `client_credentials`, API keys, and per-shop credentials as config-based authentication rather than pretending they are OAuth.
5. **Complete the smallest end-to-end slice first.** Connect extension metadata, a typed Function, the SDK route, required token/native calls, and an optional WAM. Build and test that slice before expanding it.
6. **Preserve generated SDK structure.** Keep decorators/builders, input/output schemas, module providers, and registration settings. Extend business logic inside handlers instead of reverting to a raw JSON-RPC router or manual token stack.
7. **Validate read-only behavior before mutations.** Enable cancellation, return, update, or other mutations only with an official contract and a recoverable test environment. If safe verification is impossible, return a clear unsupported result instead of simulating success.
8. **Do not retain secrets or customer data as evidence.** Never copy passwords, cookies, tokens, API keys, real tenant/domain values, or customer records into source, fixtures, logs, documentation, or recording descriptions. Let the user complete login, OTP, and CAPTCHA steps.
9. **Verify the complete flow with an installed private app.** Check function discovery, extension registration, auth/config injection, signatures, permission failures, WAM loading, and native calls.

In a managed generation or deployment environment, honor the supplied `APP_STORE_URL` and registration settings. Standalone apps may use SDK defaults and auto-registration. In both cases, pin dependencies in a lockfile, register the `/functions` root as the Function Endpoint, and use the public `@channel.io/app-sdk-wam` hooks in Channel-client WAMs.

## Prepare A Private App Before Coding

Use the [public getting-started documentation](https://developers.channel.io/ko/articles/%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-%ED%8A%9C%ED%86%A0%EB%A6%AC%EC%96%BC-516161ed) to enter the developer portal. Portal labels can change, but the required sequence is stable:

1. Create a private app for development and keep its App ID, App Secret, and Signing Key in a server-side secret store. Never put the two secrets in a WAM or commit them to Git.
2. Enable only the Channel, Manager, and User permissions required by the Functions you will test.
3. Prepare a stable public HTTPS base URL. For local development, start or reserve the HTTPS tunnel before starting an auto-registering server.
4. Set the Function Endpoint to the `/functions` root and, when the app has UI, set the WAM Endpoint to the `/resource/wam` root. Do not append `/v1` or the WAM name in the portal.
5. Start or restart the app server after credentials, permissions, and endpoint roots are saved. Auto-registration runs at startup and may need a restart after portal settings change.
6. Install the private app in a test channel, then verify discovery, command visibility, WAM loading, and both success and permission-failure paths.

The tutorial READMEs apply this order to a complete TypeScript or Go project. A managed builder may provision credentials, endpoints, installation, and registration for you; keep its runtime-provided settings instead of replacing them with standalone defaults.

## 1. Mental model

A Channel app has four cooperating parts:

1. **App metadata** identifies the app in the developer portal. `App ID` is public identity; `App Secret` and `Signing Key` are server secrets.
2. **Extensions** declare capabilities such as commands, widgets, custom tabs, OAuth, config, hooks, or commerce integration.
3. **Functions** are typed server operations. AppStore calls them with `method`, `params`, and trusted `context` after request verification.
4. **WAM** is an isolated web UI opened by a function result. It calls app functions or authorized Channel native functions through the WAM runtime.

The AppStore is the control plane between Channel clients and the app server. The SDK owns schema discovery, extension registration, routing, token lifecycle, and WAM bindings. Keep product logic in handlers and services.

A Function request contains `method`, `params`, and `context`. An Extension Function's full name is `extension.{extensionName}.{relativeFunctionName}`; an app-specific operation can instead be a standalone Function such as `tutorial.open`. Use TypeScript `@Extension` only for a standard capability supported by the SDK, not as an arbitrary namespace for custom Functions.

```text
Channel client → AppStore → signed PUT /functions/v1 → SDK validation and dispatch → Function handler
handler → WAM action → Channel client loads WAM → WAM SDK → app/native Function
```

## 2. Credentials and permission scopes

Keep each credential at the correct trust boundary:

| Value                      | Purpose                                                 | Storage                                               |
| -------------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| App ID                     | Public app identifier                                   | May be used by server and WAM                         |
| App Secret                 | Issues app/channel token pairs                          | Server secret manager only                            |
| Signing Key                | Verifies `x-signature` on incoming Function requests    | Server secret manager only                            |
| App token                  | Extension registration and app-scoped native operations | Server cache                                          |
| Channel token              | Server operations in an installed Channel               | Per-channel server cache                              |
| Manager/User authorization | Operations performed by the current Channel user in WAM | Managed by Channel runtime                            |
| Provider/config credential | External API authentication                             | Stored by AppStore and injected into Function context |

Permissions are grouped by the actor that performs the native operation:

- **App**: extension registration and app-owned operations.
- **Channel**: server-side operations in an installed channel. Obtain a channel token with `TokenManager`.
- **Manager/User**: operations initiated in a Channel client. WAM receives runtime authorization; do not mint these tokens in app server code.

Verify every incoming Function request's `x-signature` over its raw body with the Signing Key. For outgoing native calls, send an app/channel token managed by `TokenManager`, not the App Secret itself. A WAM must never hold these server secrets or tokens.

An external service token from an OAuth Authorization Code connection is injected as `ctx.authToken`; it is not a Channel App token. Store API keys, `client_credentials`, and per-shop secrets through the Config Extension and consume them through `ctx.config` and related fields. Request only permissions the app uses, and run a channel-scoped operation only where the app is installed.

## 3. TypeScript server

Install the public packages:

```bash
npm install @channel.io/app-sdk-server@0.17.0 @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs zod
```

Declare extension metadata and typed functions. AppStore discovers commands by calling `extension.command.metadata.getCommands`; do not call the legacy `registerCommands` native function in new apps.

```ts
import { z } from "zod";
import {
  Context,
  CommandResultSchema,
  Ctx,
  Extension,
  Func,
  FunctionCallError,
  FunctionCallErrorCode,
  GetCommandsOutputSchema,
  Input,
  InputSchema,
  OutputSchema,
} from "@channel.io/app-sdk-server";

const ExecuteInput = z.object({
  chat: z.object({ type: z.string(), id: z.string() }).optional(),
  trigger: z
    .object({ type: z.string(), attributes: z.record(z.string()) })
    .optional(),
  input: z.record(z.unknown()).optional(),
});

@Extension({ name: "command", systemVersion: "v1" })
export class CommandExtension {
  @Func("metadata.getCommands")
  @InputSchema(z.object({}))
  @OutputSchema(GetCommandsOutputSchema)
  getCommands() {
    return {
      commands: [
        {
          name: "hello",
          scope: "desk",
          actionFunctionName: "extension.command.command.hello",
          alfMode: "disable",
          enabledByDefault: true,
        },
      ],
    };
  }

  @Func("command.hello")
  @InputSchema(ExecuteInput)
  @OutputSchema(CommandResultSchema)
  hello(@Ctx() ctx: Context, @Input() input: z.infer<typeof ExecuteInput>) {
    return { type: "text", attributes: { message: `Hello ${ctx.caller.id}` } };
  }
}
```

Enable auto-registration and request verification. Preserve the raw request body; HMAC over re-serialized JSON is not equivalent.

```ts
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ChannelAppModule, SignatureGuard } from "@channel.io/app-sdk-server";

const channelOptions = {
  appId: process.env.APP_ID!,
  appSecret: process.env.APP_SECRET!,
  signingKey: process.env.SIGNING_KEY!,
  autoRegister: true,
};

@Module({
  imports: [ChannelAppModule.forRoot(channelOptions)],
  providers: [
    CommandExtension,
    {
      provide: APP_GUARD,
      useFactory: () => new SignatureGuard(channelOptions),
    },
  ],
})
export class AppModule {}
```

```ts
const app = await NestFactory.create(AppModule, { rawBody: true });
await app.listen(process.env.PORT ?? 3000);
```

Return expected failures with a stable public error instead of passing provider or infrastructure
exceptions through to callers:

```ts
throw new FunctionCallError(
  "The requested operation could not be completed",
  FunctionCallErrorCode.BadRequest,
  { type: "operationFailed" },
);
```

Log only sanitized diagnostic context on the server. Do not put upstream response bodies, URLs,
credentials, or tokens in Function errors.

The SDK route is `PUT /functions/:version`. Enter the root `/functions` URL in app settings; AppStore selects the registered system version.

## 4. Go server

Install the current module:

```bash
go get github.com/channel-io/cht-app-sdk/go@v0.13.14
```

Use builders for known extension families and generic typed registration for app functions:

```go
app := appsdk.New(appsdk.Options{
  AppID: os.Getenv("APP_ID"),
  AppSecret: os.Getenv("APP_SECRET"),
})

err := app.Use(command.Extension().
  GetCommands(command.StaticCommands(&command.Config{
    Name: "hello",
    Scope: command.ScopeDesk,
    ActionFunctionName: "tutorial.hello",
    AlfMode: command.AlfModeDisable,
    EnabledByDefault: true,
  })).
  Execute("tutorial.hello", executeHello),
)
if err != nil { log.Fatal(err) }

if err := server.Run(app,
  server.WithSignature(os.Getenv("SIGNING_KEY")),
  server.WithAutoRegister(),
  server.WithAddr(":8080"),
); err != nil { log.Fatal(err) }
```

The default Go route is also `PUT /functions/:version`. Mount `server/gin.NewRoute` when the app already owns a Gin engine.

Continue with the [Go SDK reference](../../reference/go/README.md) for Functions and schemas, server routing, authentication and tokens, Extensions, native Functions, and WAM integration.

## 5. Tokens and native functions

`issueToken` and `refreshToken` share a strict rate limit. Do not issue a token per request.

- Use the injected TypeScript `TokenManager` or construct one with `appId` and `appSecret`.
- Use Go `native.TokenManager`.
- Use an in-memory cache only for a single instance. Supply a shared cache implementation for multi-instance production deployments.
- Use an app token for extension registration and a channel token for server-side channel operations.

`TokenManager` caches token pairs by scope, refreshes before expiry, and deduplicates concurrent issue/refresh work. Its default in-memory cache is shared by only one process. For multiple replicas, implement the SDK cache interface with shared storage such as Redis or a database. Never place access or refresh tokens in source, WAM data, logs, or error responses.

Keep three authentication flows separate:

1. AppStore-to-app-server Function calls authenticate with `x-signature`.
2. App-server-to-Channel native calls authorize with app/channel tokens.
3. WAM manager/user native calls run with authorization supplied by the Channel host runtime.

TypeScript exposes `NativeFunctionClient.createProxyApi(accessToken)` for typed Channel operations. Go exposes typed registration/data APIs and a generic app-function client; check [Go feature parity](../../reference/go-feature-parity.md) before assuming a native proxy wrapper exists.

## 6. WAM

Install and wrap the React app:

```bash
npm install @channel.io/app-sdk-wam@0.17.0
```

```tsx
ReactDOM.createRoot(document.getElementById("root")!).render(
  <WamProvider>
    <App />
  </WamProvider>,
);
```

Use hooks rather than writing your own `window.ChannelIOWam` wrapper:

```tsx
const appId = useTypedWamData("appId") ?? "";
const { setSize } = useWamSize();
const { close } = useWamClose();
const { call: callApp } = useCallFunction({ appId, name: "tutorial.save" });
const { call: callNative } = useNativeFunction({
  name: "writeGroupMessageAsManager",
});
```

Return a WAM action from the server with `type: "wam"` and attributes containing `appId`, `name`, and minimal `wamArgs`. Serve the built SPA under `${WAM_ENDPOINT}/${name}`.

- `useCallFunction` calls your own app server Function through AppStore. Use it for business logic and work performed as the app or bot.
- `useNativeFunction` calls a manager/user Channel native Function allowed by the current Channel surface.
- Runtime values read with `useWamData` and all `wamArgs` are client data. Never pass secrets, tokens, or raw customer data through them.
- Never issue or store the App Secret, Signing Key, app token, or channel token in WAM code.

## 7. Endpoint configuration

For a host such as `https://example.ngrok.app`:

| Developer portal setting | Value                                    |
| ------------------------ | ---------------------------------------- |
| Function Endpoint        | `https://example.ngrok.app/functions`    |
| WAM Endpoint             | `https://example.ngrok.app/resource/wam` |

The resulting calls are typically `/functions/v1` and `/resource/wam/tutorial`. Use `https://app-store.channel.io` as the default AppStore base URL unless the target environment explicitly provides another value.

## 8. Test and release

Before installing the app:

1. Unit-test handlers through SDK test helpers or the Go app registry.
2. Build the server and WAM from a clean install.
3. Verify unsigned or incorrectly signed requests are rejected.
4. Expose the local server through an HTTPS tunnel.
5. Set the endpoint roots and permissions in the developer portal.
6. Install the private app in a test channel.
7. Verify extension registration, command discovery, WAM load, app calls, native calls, and error states.

Before production:

- use a shared token cache when running multiple replicas;
- never log secrets, access tokens, refresh tokens, or raw credentials;
- use a stable public HTTPS host and health checks;
- keep SDK versions explicit and review release notes before upgrades;
- validate every function input and return structured errors;
- keep App Secret and Signing Key in a secret manager.

## Sources and examples

- [Original getting-started article](https://developers.channel.io/ko/articles/%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-%ED%8A%9C%ED%86%A0%EB%A6%AC%EC%96%BC-516161ed)
- [Authentication article](https://developers.channel.io/ko/articles/e7c2fb6f)
- [Function article](https://developers.channel.io/ko/articles/77250b17)
- [Command article](https://developers.channel.io/ko/articles/b3d200dc)
- [WAM article](https://developers.channel.io/ko/articles/059680de)
- [TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts)
- [Go tutorial](https://github.com/channel-io/app-tutorial)
