# クイックスタート

最初の app を実装する前に、[基本概念](concepts.md) で standalone Function、Extension Function、WAM、authentication の境界を確認してください。

以下は SDK の接続点を示す最小 snippet であり、すべての package import と project 設定を含む
standalone file ではありません。最初から実行する場合は
[TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts) または
[Go tutorial](https://github.com/channel-io/app-tutorial) を clone し、app 作成、credential、endpoint は
[アプリ開発完全ガイド](app-development.md) に従ってください。

## TypeScript

Node.js 20.11 以上が必要です。現在公開されている server package は `0.17.0` です。

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

これは standalone Function なので、任意の `@Extension` は不要です。SDK が `PUT /functions/:version`、Function schema discovery、signature verification、core system version auto-registration を処理します。

## Go

Go 1.25 が必要です。Go SDK は `go/` 配下のモジュールとして公開されます。

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

SDK が既定の Gin サーバーを起動し、function route と auto-registration を処理します。
既存の Gin サーバーがある場合は、`server/gin` から versioned function route だけを接続できます。

```go
route := sdkgin.NewRoute(app, sdkgin.WithRoute("/functions/:version"))
route.Mount(router)
```

完全な server、WAM、private app のインストール手順は
[TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts) と
[Go tutorial](https://github.com/channel-io/app-tutorial) を参照してください。
