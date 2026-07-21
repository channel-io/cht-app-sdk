# 앱 개발 전체 가이드

이 문서는 Channel App Store 앱을 만드는 현재의 SDK 우선 경로를 설명합니다. 기존 App 웹 문서에 있는 raw JSON-RPC, 수동 토큰 캐시, 수동 커맨드 등록, `window.ChannelIOWam` 직접 호출은 프로토콜 이해용으로만 보고 신규 구현은 SDK를 사용하세요.

2026-07-22에 확인한 공개 버전은 다음과 같습니다.

- TypeScript server/core/WAM: `0.17.0`
- TypeScript WAM UI: `0.2.2`
- Go: `v0.13.14`
- Node.js: 20.11 이상
- Go: 1.25

자동화에서 버전을 고정하기 전에는 npm 또는 Git 태그에서 최신 버전을 다시 확인하세요.

TypeScript `0.17.0`의 주요 추가 사항은 app-level public webhook ingress용 `webhook.received` hook metadata입니다. 외부 webhook이 필요하면 임의 route를 먼저 만들지 말고 [Hook extension reference](../../reference/typescript/extensions/hook.md)의 `targetId`, `endpointToken`, 비동기 전달 제약을 확인하세요.

처음이라면 [핵심 개념](concepts.md)에서 Function, Extension, WAM, 인증 경계를 먼저 읽으세요. 전체 앱을 바로 실행해 보려면 [TypeScript 튜토리얼](https://github.com/channel-io/app-tutorial-ts)과 [Go 튜토리얼](https://github.com/channel-io/app-tutorial)을 사용하세요. 이 문서와 공개 SDK export가 계약의 기준이고, 튜토리얼은 server·WAM·설정을 한곳에서 보여 주는 실행 예제입니다.

## 권장 개발 방법론

앱 생성 도구를 사용하거나 직접 구현할 때 다음 순서로 진행하세요.

1. **사용자 결과부터 정의합니다.** 앱이 해결할 작업, 실행 위치(command, widget, custom tab, hook, WAM), 필요한 Channel 권한을 먼저 적습니다.
2. **표준 Extension과 Function을 먼저 고릅니다.** SDK가 제공하는 extension schema와 표준 function name을 확인하고, 같은 목적의 자체 protocol이나 이름을 새로 만들지 않습니다.
3. **근거가 있는 integration만 구현합니다.** 외부 서비스의 공식 API 문서를 우선 사용합니다. 공개 API가 없어 화면 자동화가 꼭 필요하면 재현 가능한 사용자 흐름을 관찰해 구현하되 URL, request schema, tenant 값을 추측하지 않습니다.
4. **인증 방식을 정확히 분류합니다.** Authorization Code flow는 OAuth extension과 `ctx.authToken`을 사용합니다. `client_credentials`, API key, shop별 credential은 config 기반 인증으로 처리하며 OAuth처럼 가장하지 않습니다.
5. **가장 작은 end-to-end slice를 먼저 완성합니다.** Extension metadata, typed Function, SDK route, 필요한 token/native call, 선택적 WAM을 한 흐름으로 연결하고 build·test한 뒤 기능을 늘립니다.
6. **생성된 SDK 골격을 보존합니다.** Decorator/builder, input/output schema, module provider, registration 설정은 유지하고 handler 내부의 제품 로직만 확장합니다. Raw JSON-RPC router나 수동 token stack으로 되돌리지 않습니다.
7. **안전한 read-only 검증부터 시작합니다.** 취소·반품·수정 같은 변경 작업은 공식 계약과 복구 가능한 test 환경이 있을 때만 활성화합니다. 안전하게 확인할 수 없으면 성공을 가장하지 말고 지원하지 않는 이유를 명확히 반환합니다.
8. **비밀과 고객 정보를 증거로 남기지 않습니다.** Password, cookie, token, API key, 실제 tenant/domain, 고객 데이터는 source, fixture, log, 문서, 녹화 설명에 복사하지 않습니다. 로그인·OTP·CAPTCHA는 사용자가 직접 완료하게 합니다.
9. **설치된 private app으로 전체 흐름을 검증합니다.** Function discovery, extension 등록, auth/config 주입, signature, permission failure, WAM load와 native call까지 확인합니다.

관리형 생성·배포 환경에서는 제공된 `APP_STORE_URL`과 registration 설정을 존중하세요. 독립 앱은 SDK 기본값과 auto-registration을 사용할 수 있습니다. 어느 방식이든 dependency를 lockfile로 고정하고, Function Endpoint에는 `/functions` root를 등록하며, Channel client의 WAM은 공개 `@channel.io/app-sdk-wam` hook을 사용합니다.

## 구현 전에 private app 준비하기

[공개 시작하기 문서](https://developers.channel.io/ko/articles/%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-%ED%8A%9C%ED%86%A0%EB%A6%AC%EC%96%BC-516161ed)를 통해 개발자 포털에 들어가세요. 포털의 화면 이름은 바뀔 수 있지만 필요한 순서는 같습니다.

1. 개발용 private app을 만들고 App ID, App Secret, Signing Key를 확인합니다. 두 secret은 server secret store에만 보관하고 WAM이나 Git에 넣지 않습니다.
2. 테스트할 Function에 필요한 Channel, Manager, User 권한만 활성화합니다.
3. 안정적인 public HTTPS base URL을 준비합니다. 로컬 개발에서는 auto-registration server를 시작하기 전에 HTTPS tunnel을 먼저 열거나 URL을 예약합니다.
4. Function Endpoint는 `/functions` root로, UI가 있으면 WAM Endpoint는 `/resource/wam` root로 설정합니다. 포털 값에 `/v1`이나 WAM 이름을 덧붙이지 않습니다.
5. Credential, permission, endpoint root를 저장한 뒤 app server를 시작하거나 재시작합니다. Auto-registration은 시작 시 실행되므로 포털 설정을 바꿨다면 재시작이 필요할 수 있습니다.
6. 테스트 채널에 private app을 설치하고 discovery, command 노출, WAM load, 성공과 permission failure를 확인합니다.

튜토리얼 README는 이 순서를 완전한 TypeScript 또는 Go project에 적용합니다. 관리형 builder가 credential, endpoint, 설치, registration을 대신 준비했다면 runtime이 제공한 값을 standalone 기본값으로 덮어쓰지 마세요.

## 1. 전체 구조

Channel 앱은 네 부분이 함께 동작합니다.

1. **앱 메타데이터**는 개발자 포털에서 앱을 식별합니다. `App ID`는 공개 식별자이고 `App Secret`과 `Signing Key`는 서버 비밀입니다.
2. **Extension**은 command, widget, custom tab, OAuth, config, hook, commerce 같은 기능군을 선언합니다.
3. **Function**은 타입이 있는 서버 동작입니다. AppStore는 검증된 요청의 `method`, `params`, `context`로 함수를 호출합니다.
4. **WAM**은 Function 응답이 여는 격리된 웹 UI입니다. WAM runtime을 통해 앱 Function이나 허용된 Channel native function을 호출합니다.

AppStore는 Channel 클라이언트와 앱 서버 사이의 control plane입니다. SDK가 schema 탐색, extension 등록, route, token lifecycle, WAM binding을 처리하게 하고 앱 코드는 handler와 service의 비즈니스 로직에 집중하세요.

Function request는 `method`, `params`, `context`로 구성됩니다. Extension Function의 전체 이름은 `extension.{extensionName}.{relativeFunctionName}`이고, 앱 고유 동작은 `tutorial.open` 같은 standalone Function으로 등록할 수 있습니다. TypeScript의 `@Extension`은 SDK가 지원하는 표준 capability에만 사용하며, 고유 Function을 담기 위한 임의 Extension을 만들지 않습니다.

```text
Channel 클라이언트 → AppStore → 서명된 PUT /functions/v1 → SDK 검증·dispatch → Function handler
handler → WAM action → Channel 클라이언트가 WAM 로드 → WAM SDK → app/native Function
```

## 2. 인증 정보와 권한

다음 값은 서버에서만 보관합니다.

| 값                         | 용도                                             | 보관 위치                                   |
| -------------------------- | ------------------------------------------------ | ------------------------------------------- |
| App ID                     | 앱의 공개 식별자                                 | 서버와 WAM에서 사용 가능                    |
| App Secret                 | app/channel token pair 발급                      | 서버 secret manager만                       |
| Signing Key                | 수신 Function 요청의 `x-signature` 검증          | 서버 secret manager만                       |
| App token                  | Extension 등록과 app-scoped native operation     | 서버 cache                                  |
| Channel token              | 설치된 채널에서 서버가 수행하는 operation        | channel별 서버 cache                        |
| Manager/User authorization | 현재 Channel 사용자가 WAM에서 수행하는 operation | Channel runtime이 관리                      |
| Provider/config credential | 외부 API 인증                                    | AppStore가 보관하고 Function context에 주입 |

Native operation의 실행 주체에 따라 권한이 나뉩니다.

- **App**: extension 등록과 앱 소유 동작
- **Channel**: 앱이 설치된 채널에서 서버가 실행하는 동작. `TokenManager`로 channel token을 받습니다.
- **Manager/User**: Channel 클라이언트에서 시작하는 동작. WAM이 runtime authorization을 전달받으며 앱 서버가 이 token을 발급하지 않습니다.

수신 Function 요청은 raw body와 Signing Key로 `x-signature`를 검증해야 합니다. 서버에서 native function을 호출할 때는 App Secret 자체를 보내는 대신 `TokenManager`가 관리하는 app/channel token을 사용합니다. WAM은 이 서버 비밀이나 token을 보관하지 않습니다.

OAuth Authorization Code로 연결한 외부 서비스 token은 `ctx.authToken`으로 주입됩니다. 이것은 Channel App token이 아닙니다. API key, `client_credentials`, 매장별 secret은 Config Extension으로 저장하고 `ctx.config` 등에서 받아 사용하세요. 실제 사용하는 권한만 요청하고, channel scope 동작은 해당 채널에 앱이 설치된 경우에만 실행하세요.

## 3. TypeScript 서버

```bash
npm install @channel.io/app-sdk-server@0.17.0 @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs zod
```

신규 앱은 `registerCommands`를 직접 호출하지 않습니다. `command` extension과 `extension.command.metadata.getCommands`를 선언하면 AppStore가 command metadata를 탐색합니다.

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

Auto-registration과 서명 검증을 켭니다. JSON을 다시 직렬화한 결과가 아니라 수신한 raw body를 그대로 HMAC에 사용해야 합니다.

```ts
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

예상 가능한 실패는 provider나 infrastructure exception을 그대로 전달하지 말고 안정적인 공개 오류로 반환하세요.

```ts
throw new FunctionCallError(
  "요청한 작업을 완료할 수 없습니다",
  FunctionCallErrorCode.BadRequest,
  { type: "operationFailed" },
);
```

상세 진단은 server에서 민감 정보를 제거한 뒤 기록합니다. Upstream response body, URL, credential, token을 Function 오류에 넣지 마세요.

SDK route는 `PUT /functions/:version`입니다. 앱 설정에는 `/functions` root URL을 입력하고 AppStore가 등록된 system version을 선택하게 합니다.

## 4. Go 서버

```bash
go get github.com/channel-io/cht-app-sdk/go@v0.13.14
```

알려진 extension family는 builder를, 앱 고유 Function은 generic typed registration을 사용합니다.

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

Go의 기본 route도 `PUT /functions/:version`입니다. 이미 Gin engine이 있으면 `server/gin.NewRoute`만 mount하세요.

Function과 schema, 서버 route, 인증과 token, Extension, native Function, WAM 연동의 자세한 내용은 [Go SDK 레퍼런스](../../reference/go/README.md)를 참고하세요.

## 5. Token과 native function

`issueToken`과 `refreshToken`에는 동일한 제한된 rate limit이 적용됩니다. 요청마다 token을 새로 발급하지 마세요.

- TypeScript는 주입된 `TokenManager`를 사용하거나 `appId`, `appSecret`으로 생성합니다.
- Go는 `native.TokenManager`를 사용합니다.
- 단일 instance는 기본 in-memory cache를 사용할 수 있습니다.
- 여러 replica는 Redis나 database 기반 shared cache를 연결합니다.
- Extension 등록에는 app token, 서버의 channel 동작에는 channel token을 사용합니다.

`TokenManager`는 scope별 token pair를 cache하고 만료 전에 refresh하며, 동시에 들어온 발급/refresh 요청을 합칩니다. 기본 in-memory cache는 한 프로세스에서만 공유되므로 여러 replica에서는 SDK cache interface로 Redis나 database 같은 shared storage를 연결하세요. Access token과 refresh token은 source, WAM, log, 오류 응답에 넣지 않습니다.

세 가지 인증 흐름을 혼동하지 마세요.

1. AppStore에서 앱 서버로 들어오는 Function은 `x-signature`로 인증합니다.
2. 앱 서버에서 Channel native function으로 나가는 호출은 app/channel token으로 권한을 증명합니다.
3. WAM의 manager/user native 호출은 Channel host runtime이 현재 사용자 권한으로 실행합니다.

TypeScript `NativeFunctionClient.createProxyApi(accessToken)`은 Channel operation을 typed method로 제공합니다. Go에서 같은 wrapper가 있다고 가정하지 말고 [Go 기능 동등성](../../reference/go-feature-parity.md)을 먼저 확인하세요.

## 6. WAM

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

자체 `window.ChannelIOWam` wrapper 대신 SDK hook을 사용합니다.

```tsx
const appId = useTypedWamData("appId") ?? "";
const { setSize } = useWamSize();
const { close } = useWamClose();
const { call: callApp } = useCallFunction({ appId, name: "tutorial.save" });
const { call: callNative } = useNativeFunction({
  name: "writeGroupMessageAsManager",
});
```

서버는 `type: "wam"`과 `appId`, `name`, 최소한의 `wamArgs`를 attributes에 담아 반환합니다. 빌드된 SPA는 `${WAM_ENDPOINT}/${name}`에서 제공하세요.

- `useCallFunction`은 AppStore를 거쳐 자신의 앱 서버 Function을 호출합니다. Bot/app 주체의 동작과 비즈니스 로직에 사용합니다.
- `useNativeFunction`은 현재 Channel surface가 허용한 manager/user 주체의 Channel native function을 호출합니다.
- `useWamData`로 읽는 runtime 값과 `wamArgs`는 클라이언트 데이터입니다. Secret, token, 고객 원문을 전달하지 마세요.
- WAM에서 App Secret, Signing Key, app token, channel token을 발급하거나 저장하지 마세요.

## 7. Endpoint 설정

호스트가 `https://example.ngrok.app`이라면 다음 root를 등록합니다.

| 개발자 포털 설정  | 값                                       |
| ----------------- | ---------------------------------------- |
| Function Endpoint | `https://example.ngrok.app/functions`    |
| WAM Endpoint      | `https://example.ngrok.app/resource/wam` |

실제 호출은 보통 `/functions/v1`, `/resource/wam/tutorial`이 됩니다. 환경에서 별도 값을 제공하지 않으면 SDK 기본 AppStore base URL인 `https://app-store.channel.io`를 사용하세요.

## 8. 테스트와 배포

앱 설치 전:

1. SDK test helper 또는 Go app registry로 handler를 단위 테스트합니다.
2. 깨끗한 install에서 server와 WAM을 build합니다.
3. 서명이 없거나 틀린 요청이 거절되는지 확인합니다.
4. HTTPS tunnel로 로컬 서버를 노출합니다.
5. 개발자 포털에 endpoint root와 permission을 설정합니다.
6. 테스트 채널에 private app을 설치합니다.
7. Extension 등록, command 탐색, WAM load, app/native call, 오류 상태를 확인합니다.

Production 전:

- 여러 replica라면 shared token cache를 사용합니다.
- secret, access token, refresh token, credential을 log에 남기지 않습니다.
- 안정적인 public HTTPS host와 health check를 준비합니다.
- SDK 버전을 명시적으로 고정하고 upgrade 전에 release note를 검토합니다.
- 모든 Function input을 검증하고 구조화된 오류를 반환합니다.
- App Secret과 Signing Key를 secret manager에 저장합니다.

## 참고 자료와 예제

- [기존 시작하기 문서](https://developers.channel.io/ko/articles/%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-%ED%8A%9C%ED%86%A0%EB%A6%AC%EC%96%BC-516161ed)
- [인증 및 권한](https://developers.channel.io/ko/articles/e7c2fb6f)
- [Function](https://developers.channel.io/ko/articles/77250b17)
- [Command](https://developers.channel.io/ko/articles/b3d200dc)
- [WAM](https://developers.channel.io/ko/articles/059680de)
- [TypeScript 튜토리얼](https://github.com/channel-io/app-tutorial-ts)
- [Go 튜토리얼](https://github.com/channel-io/app-tutorial)
