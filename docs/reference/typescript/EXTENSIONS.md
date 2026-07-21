# TypeScript Extensions

An extension is a named, versioned function surface registered with AppStore. Current TypeScript apps should implement extensions with the decorators exported by `@channel.io/app-sdk-server`.

## Function names

Inside an extension, a relative function such as `metadata.getCommands` becomes:

```text
extension.{extensionName}.metadata.getCommands
```

Plain app functions referenced by metadata may use names such as `tutorial.open` or `orders.sync`.

## Minimal command extension

```ts
import { z } from "zod";
import {
  Extension,
  Func,
  InputSchema,
  OutputSchema,
  GetCommandsOutputSchema,
  CommandResultSchema,
} from "@channel.io/app-sdk-server";

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
          actionFunctionName: "extension.command.command.open",
          alfMode: "disable",
          enabledByDefault: true,
        },
      ],
    };
  }

  @Func("command.open")
  @InputSchema(z.object({}).passthrough())
  @OutputSchema(CommandResultSchema)
  open() {
    return { type: "text", attributes: { message: "Hello" } };
  }
}
```

Register decorated classes as NestJS providers:

```ts
@Module({
  imports: [
    ChannelAppModule.forRoot({
      appId: process.env.APP_ID!,
      appSecret: process.env.APP_SECRET!,
      autoRegister: true,
    }),
  ],
  providers: [CommandExtension],
})
export class AppModule {}
```

Auto-registration issues an app token through the shared `TokenManager`, calls `registerExtension`, and lets AppStore discover metadata and function schemas through the versioned Function Endpoint.

## Extension guide index

| Extension        | Metadata/function guide                   |
| ---------------- | ----------------------------------------- |
| Command          | [command.md](extensions/command.md)       |
| Config           | [config.md](extensions/config.md)         |
| OAuth            | [oauth.md](extensions/oauth.md)           |
| API key (legacy) | [apikey.md](extensions/apikey.md)         |
| Calendar         | [calendar.md](extensions/calendar.md)     |
| Widget           | [widget.md](extensions/widget.md)         |
| Custom tab       | [customtab.md](extensions/customtab.md)   |
| Hook             | [hook.md](extensions/hook.md)             |
| Polling          | [polling.md](extensions/polling.md)       |
| Store            | [store.md](extensions/store.md)           |
| DataSource       | [datasource.md](extensions/datasource.md) |
| Messaging        | [messaging.md](extensions/messaging.md)   |
| ALF task         | [alf-task.md](extensions/alf-task.md)     |
| Notebook         | [notebook.md](extensions/notebook.md)     |
| Mail relay       | [mail-relay.md](extensions/mail-relay.md) |

## Choosing an API

- Use decorators for known extension families and NestJS dependency injection.
- Use standalone decorator providers for small app/core Functions. The legacy `ChannelApp` simple service is deprecated.
- Use public extension schemas as `@InputSchema` and `@OutputSchema` values.
- Use `NativeFunctionClient` only for AppStore/Channel operations, not to replace incoming function routing.
- Use `@channel.io/app-sdk-wam` for frontend runtime calls.

Do not use `createExtension()` or `defineFunction()` examples from older templates: those factories are not part of the current public package exports.
