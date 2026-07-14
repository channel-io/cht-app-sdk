# クイックスタート

## TypeScript

既存の TypeScript 利用側は import を変更する必要がありません。

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

Go SDK は `go/` 配下のモジュールとして公開します。

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

SDK が既定の Gin サーバーを起動し、function route と auto-registration を処理します。
既存の Gin サーバーがある場合は、`server/gin` から versioned function route だけを接続できます。

```go
route := sdkgin.NewRoute(app, sdkgin.WithRoute("/functions/:version"))
route.Mount(router)
```
