# Quickstart

## TypeScript

Existing TypeScript consumers do not need to change imports.

```bash
npm install @channel.io/app-sdk-server @channel.io/app-sdk-core
```

```ts
import { ChannelApp } from "@channel.io/app-sdk-server";
import { z } from "zod";

export const app = new ChannelApp({
  appId: process.env.APP_ID!,
  appSecret: process.env.APP_SECRET!,
}).function(
  "extension.example.echo",
  z.object({ message: z.string() }),
  async (_ctx, input) => ({ message: input.message }),
);
```

## Go

The Go SDK is published from the `go/` module.

```bash
go get github.com/channel-io/cht-app-sdk/go@v0.8.3
```

```go
app := appsdk.New(appsdk.Options{
  AppID:     os.Getenv("APP_ID"),
  AppSecret: os.Getenv("APP_SECRET"),
})

appsdk.MustRegister(app, "extension.example.echo",
  func(ctx context.Context, fnCtx appsdk.Context, in *EchoInput) (*EchoOutput, error) {
    return &EchoOutput{Message: in.Message}, nil
  },
)

server.Run(app,
  server.WithSignature(os.Getenv("SIGNING_KEY")),
  server.WithAutoRegister(),
  server.WithAddr(":8080"),
)
```

The SDK starts the default Gin server and handles the function route plus
auto-registration. If you already own a Gin server, you can mount only the
versioned function route from `server/gin`.

```go
route := sdkgin.NewRoute(app, sdkgin.WithRoute("/functions/:version"))
route.Mount(router)
```
