# 빠른 시작

## TypeScript

기존 TypeScript 사용처는 import를 바꾸지 않아도 됩니다.

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

Go SDK는 `go/` 하위 모듈로 배포됩니다.

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

SDK가 기본 Gin 서버를 띄우고 function route와 auto-registration을 처리합니다.
기존 Gin 서버가 있다면 `server/gin`에서 versioned function route만 연결할 수도 있습니다.

```go
route := sdkgin.NewRoute(app, sdkgin.WithRoute("/functions/:version"))
route.Mount(router)
```
