# Quickstart

Before implementing your first app, read [Concepts](concepts.md) for standalone Functions, Extension Functions, WAM, and authentication boundaries.

The code below is a minimal integration snippet, not a standalone file with every package import and
project setting. For a copyable first run, clone the
[TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts) or
[Go tutorial](https://github.com/channel-io/app-tutorial), and use the
[complete app-development guide](app-development.md) for app creation, credentials, and endpoints.

## TypeScript

Requires Node.js 20.11 or newer. The current published server package is `0.17.0`.

```bash
npm install @channel.io/app-sdk-server@0.17.0 @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs zod
```

```ts
import "reflect-metadata";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { NestFactory } from "@nestjs/core";
import {
  ChannelAppModule,
  Func,
  Input,
  InputSchema,
  OutputSchema,
  SignatureGuard,
} from "@channel.io/app-sdk-server";
import { z } from "zod";

const channelOptions = {
  appId: process.env.APP_ID!,
  appSecret: process.env.APP_SECRET!,
  signingKey: process.env.SIGNING_KEY!,
  autoRegister: true,
};
const EchoInput = z.object({ message: z.string() });
const EchoOutput = z.object({ message: z.string() });

class EchoFunctions {
  @Func("example.echo")
  @InputSchema(EchoInput)
  @OutputSchema(EchoOutput)
  echo(@Input() input: z.infer<typeof EchoInput>) {
    return { message: input.message };
  }
}

@Module({
  imports: [ChannelAppModule.forRoot(channelOptions)],
  providers: [
    EchoFunctions,
    {
      provide: APP_GUARD,
      useFactory: () => new SignatureGuard(channelOptions),
    },
  ],
})
class AppModule {}

const app = await NestFactory.create(AppModule, { rawBody: true });
await app.listen(process.env.PORT ?? 3000);
```

This is a standalone Function, so no arbitrary `@Extension` is needed. The SDK exposes `PUT /functions/:version`, discovers the Function schema, verifies signed requests, and auto-registers the core system version.

## Go

Requires Go 1.25. The Go SDK is published from the `go/` module.

```bash
go get github.com/channel-io/cht-app-sdk/go@v0.13.14
```

```go
app := appsdk.New(appsdk.Options{
  AppID:     os.Getenv("APP_ID"),
  AppSecret: os.Getenv("APP_SECRET"),
})

appsdk.MustRegister(app, "example.echo",
  func(ctx context.Context, fnCtx appsdk.Context, in *EchoInput) (*EchoOutput, error) {
    return &EchoOutput{Message: in.Message}, nil
  },
)

if err := server.Run(app,
  server.WithSignature(os.Getenv("SIGNING_KEY")),
  server.WithAutoRegister(),
  server.WithAddr(":8080"),
); err != nil {
  log.Fatal(err)
}
```

The SDK starts the default Gin server and handles the function route plus
auto-registration. If you already own a Gin server, you can mount only the
versioned function route from `server/gin`.

```go
route := sdkgin.NewRoute(app, sdkgin.WithRoute("/functions/:version"))
route.Mount(router)
```

For the complete server, WAM, and private-app installation flow, use the
[TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts) or
[Go tutorial](https://github.com/channel-io/app-tutorial).
