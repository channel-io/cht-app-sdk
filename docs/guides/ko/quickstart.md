# 빠른 시작

처음이라면 구현 전에 [핵심 개념](concepts.md)에서 standalone Function, Extension Function, WAM, 인증 경계를 확인하세요.

아래 코드는 SDK 연결 지점을 보여 주는 최소 snippet이며 package/import와 project 설정을 모두
포함한 독립 실행 파일은 아닙니다. 처음부터 실행하려면 [TypeScript 튜토리얼](https://github.com/channel-io/app-tutorial-ts)이나
[Go 튜토리얼](https://github.com/channel-io/app-tutorial)을 clone하고, 앱 생성·credential·endpoint 설정은
[앱 개발 전체 가이드](app-development.md)를 따르세요.

## TypeScript

Node.js 20.11 이상이 필요합니다. 현재 공개된 server 패키지는 `0.17.0`입니다.

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

이 코드는 standalone Function이므로 임의의 `@Extension`이 필요하지 않습니다. SDK가 `PUT /functions/:version`, Function schema discovery, 서명 검증, core system version auto-registration을 처리합니다.

## Go

Go 1.25가 필요합니다. Go SDK는 `go/` 하위 모듈로 배포됩니다.

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

SDK가 기본 Gin 서버를 띄우고 function route와 auto-registration을 처리합니다.
기존 Gin 서버가 있다면 `server/gin`에서 versioned function route만 연결할 수도 있습니다.

```go
route := sdkgin.NewRoute(app, sdkgin.WithRoute("/functions/:version"))
route.Mount(router)
```

전체 server, WAM, private app 설치 흐름은 [TypeScript 튜토리얼](https://github.com/channel-io/app-tutorial-ts)과
[Go 튜토리얼](https://github.com/channel-io/app-tutorial)을 참고하세요.
