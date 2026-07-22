# アプリ開発完全ガイド

この文書は、Channel App Store アプリを作る現在の SDK-first の手順を説明します。旧 App Web 記事にある raw JSON-RPC、手動 token cache、手動 command 登録、`window.ChannelIOWam` の直接呼び出しは protocol 理解用とし、新規実装では SDK を使用してください。

2026-07-22 に確認した公開バージョン:

- TypeScript server/core/WAM: `0.17.2`
- TypeScript WAM UI: `0.4.0`
- Go: `v0.14.0`
- Node.js: 20.11 以上
- Go: 1.25

自動化で固定する前に npm または Git tag で最新バージョンを再確認してください。

現在の TypeScript `0.17.2` 系は、app-level public webhook ingress 用の `webhook.received` hook metadata をサポートします。任意の webhook route を先に作るのではなく、[Hook extension reference](../../reference/typescript/extensions/hook.md) で `targetId`、`endpointToken`、非同期 delivery の制約を確認してください。

これらの用語が初めての場合は、[基本概念](concepts.md) で Function、Extension、WAM、authentication の境界を先に確認してください。完全に実行できるアプリは [TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts) と [Go tutorial](https://github.com/channel-io/app-tutorial) を参照してください。このガイドと public SDK export が contract の基準であり、tutorial は server・WAM・設定をまとめた実行例です。

## 推奨開発方法

Builder で project を生成する場合も直接実装する場合も、次の順序で進めてください。

1. **User outcome を先に定義します。** 解決する job、実行場所（command、widget、custom tab、hook、WAM）、必要最小限の Channel permission を整理します。
2. **標準 Extension と Function を先に選びます。** SDK の extension schema と標準 function name を確認し、既存 contract と同じ目的の独自 protocol や別名を作りません。
3. **根拠のある integration だけを実装します。** 外部 provider の公式 API 文書を優先します。公開 API がなく browser automation が必要な場合は、再現可能な user workflow を観察し、URL、request schema、tenant value を推測しません。
4. **認証方式を正しく分類します。** Authorization Code flow は OAuth extension と `ctx.authToken` を使います。`client_credentials`、API key、shop ごとの credential は config-based authentication とし、OAuth のように扱いません。
5. **最小の end-to-end slice を先に完成させます。** Extension metadata、typed Function、SDK route、必要な token/native call、optional WAM を接続し、build・test 後に機能を拡張します。
6. **生成済み SDK structure を維持します。** Decorator/builder、input/output schema、module provider、registration setting を保ち、raw JSON-RPC router や手動 token stack に戻さず handler 内の business logic を拡張します。
7. **Mutation より read-only 検証を先に行います。** Cancel、return、update などは公式 contract と復元可能な test environment がある場合だけ有効にします。安全に確認できない場合は成功を偽装せず、unsupported reason を明確に返します。
8. **Secret や customer data を evidence として残しません。** Password、cookie、token、API key、実際の tenant/domain、customer record を source、fixture、log、document、recording description にコピーしません。Login、OTP、CAPTCHA は user が直接完了します。
9. **Install 済み private app で全体を検証します。** Function discovery、extension registration、auth/config injection、signature、permission failure、WAM load、native call を確認します。

Hosting platform が `APP_STORE_URL` または registration setting を提供する場合は、その値を維持してください。Standalone app は SDK default と auto-registration を使用できます。どちらも dependency を lockfile に固定し、Function Endpoint には `/functions` root を登録し、Channel client の WAM では public `@channel.io/app-sdk-wam` hook を使います。

## 実装前に private app を準備する

[公開 Getting Started 文書](https://developers.channel.io/ko/articles/%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-%ED%8A%9C%ED%86%A0%EB%A6%AC%EC%96%BC-516161ed) から developer portal に入ってください。Portal の表示名が変わっても必要な順序は同じです。

1. 開発用 private app を作成し、App ID、App Secret、Signing Key を確認します。2 つの secret は server-side secret store だけに保存し、WAM や Git に入れません。
2. Test する Function に必要な Channel、Manager、User permission だけを有効にします。
3. 安定した public HTTPS base URL を用意します。Local development では auto-registering server を起動する前に HTTPS tunnel を開始するか URL を予約します。
4. Function Endpoint は `/functions` root、UI がある場合の WAM Endpoint は `/resource/wam` root にします。Portal の値に `/v1` や WAM name を追加しません。
5. Credential、permission、endpoint root を保存してから app server を起動または再起動します。Auto-registration は起動時に実行されるため、portal setting の変更後は再起動が必要な場合があります。
6. Test channel に private app を install し、discovery、command 表示、WAM load、成功と permission failure を確認します。

Tutorial README は、この順序を完全な TypeScript または Go project に適用します。Hosting platform が credential、endpoint、install、registration を準備する場合は、提供された setting を standalone default で上書きしないでください。

## 1. 全体像

Channel アプリは次の 4 部分で構成されます。

1. **App metadata**: developer portal でアプリを識別します。`App ID` は公開識別子、`App Secret` と `Signing Key` は server secret です。
2. **Extension**: command、widget、custom tab、OAuth、config、hook、commerce などの capability を宣言します。
3. **Function**: 型付き server operation です。AppStore は検証済みの `method`、`params`、`context` で呼び出します。
4. **WAM**: Function result が開く隔離された Web UI です。WAM runtime 経由で app function または許可された Channel native function を呼び出します。

AppStore は Channel client と app server の control plane です。Schema discovery、extension registration、route、token lifecycle、WAM binding は SDK に任せ、アプリ固有ロジックを handler/service に置いてください。

Function request は `method`、`params`、`context` で構成されます。Extension Function の完全名は `extension.{extensionName}.{relativeFunctionName}` です。App 固有の operation は `tutorial.open` のような standalone Function として登録できます。TypeScript の `@Extension` は SDK がサポートする標準 capability にだけ使い、custom Function 用の任意 namespace として使わないでください。

```text
Channel client → AppStore → 署名付き PUT /functions/v1 → SDK の検証・dispatch → Function handler
handler → WAM action → Channel client が WAM を load → WAM SDK → app/native Function
```

## 2. Credential と permission

各 credential を正しい trust boundary に保存します。

| 値                         | 用途                                                  | 保存場所                                  |
| -------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| App ID                     | App の公開識別子                                      | Server と WAM で使用可能                  |
| App Secret                 | app/channel token pair の発行                         | Server secret manager のみ                |
| Signing Key                | 受信 Function の `x-signature` 検証                   | Server secret manager のみ                |
| App token                  | Extension registration と app-scoped native operation | Server cache                              |
| Channel token              | Install 済み Channel で server が行う operation       | Channel ごとの server cache               |
| Manager/User authorization | WAM で現在の Channel user が行う operation            | Channel runtime が管理                    |
| Provider/config credential | 外部 API authentication                               | AppStore が保存し Function context に注入 |

Native operation の実行主体ごとに permission が分かれます。

- **App**: extension registration と app-owned operation
- **Channel**: install 済み channel で server が実行する operation。`TokenManager` から channel token を取得します。
- **Manager/User**: Channel client から開始する operation。WAM は runtime authorization を受け取り、app server はこれらの token を発行しません。

受信 Function request は raw body と Signing Key で `x-signature` を検証します。Server から native function を呼ぶときは App Secret 自体ではなく、`TokenManager` が管理する app/channel token を送ります。WAM にこれらの server secret や token を持たせないでください。

OAuth Authorization Code connection の外部 service token は `ctx.authToken` に注入されます。これは Channel App token ではありません。API key、`client_credentials`、shop ごとの secret は Config Extension で保存し、`ctx.config` などから使います。必要な permission だけを要求し、channel scope operation は app が install 済みの Channel でのみ実行してください。

## 3. TypeScript server

```bash
npm install @channel.io/app-sdk-server@0.17.2 @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs zod
```

新規アプリでは `registerCommands` を直接呼びません。`command` extension と `extension.command.metadata.getCommands` を宣言すると、AppStore が command metadata を discovery します。

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

Auto-registration と signature verification を有効にします。再 serialize した JSON ではなく、受信した raw body を HMAC に使用してください。

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

想定内の failure は provider や infrastructure exception をそのまま返さず、安定した公開 error に変換します。

```ts
throw new FunctionCallError(
  "要求された操作を完了できませんでした",
  FunctionCallErrorCode.BadRequest,
  { type: "operationFailed" },
);
```

詳細な診断情報は server で sanitize して記録します。Upstream response body、URL、credential、token を Function error に含めないでください。

SDK route は `PUT /functions/:version` です。Versioned discovery が登録済み system version
を追加できるよう、app setting には `/functions` root URL を入力します。現在の一部 caller
は、`systemVersion` を持たない command action のように、設定された root をそのまま呼びます。
Hosting platform が bare `PUT /functions` を default `/functions/v1` handler に map する場合があります。
Standalone deployment も exact request body を保持し、SDK signature guard と handler を再利用する
限定的な ingress mapping を用意してください。Portal に `/functions/v1` を入力したり、検証を
迂回する別 dispatch を実装したりしないでください。TypeScript tutorial に完全な mapping と
regression test があります。

## 4. Go server

```bash
go get github.com/channel-io/app-sdk/go@v0.14.0
```

既知の extension family は builder、app 固有 function は generic typed registration を使います。

```go
app := appsdk.New(appsdk.Options{
  AppID: os.Getenv("APP_ID"),
  AppSecret: os.Getenv("APP_SECRET"),
})

err := app.Use(command.Extension().
  GetCommands(command.StaticCommands(&command.Config{
    Name: "hello", Scope: command.ScopeDesk,
    ActionFunctionName: "tutorial.hello",
    AlfMode: command.AlfModeDisable, EnabledByDefault: true,
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

Go の default route も `PUT /functions/:version` です。既存 Gin engine には
`server/gin.NewRoute` を mount してください。Managed ingress がない場合は bare
`PUT /functions` も versioned route と同じ `server.Handler().Handle` に接続します。Go tutorial
は signature verification を迂回しない compatibility route を示します。

Function と schema、server route、authentication と token、Extension、native Function、WAM integration の詳細は [Go SDK reference](../../reference/go/README.md) を参照してください。

## 5. Token と native function

`issueToken` と `refreshToken` は同じ厳しい rate limit を共有します。Request ごとに token を発行しないでください。

- TypeScript は注入された `TokenManager`、または `appId` と `appSecret` で生成した manager を使います。
- Go は `native.TokenManager` を使います。
- 単一 instance は default in-memory cache を利用できます。
- 複数 replica では Redis/database などの shared cache を実装します。
- Extension registration には app token、server-side channel operation には channel token を使います。

`TokenManager` は scope ごとに token pair を cacheし、期限前に refresh し、同時の issue/refresh を deduplicate します。Default in-memory cache は 1 process 内でしか共有されません。複数 replica では SDK cache interface を Redis や database などの shared storage で実装してください。Access token と refresh token を source、WAM data、log、error response に入れないでください。

次の 3 つの authentication flow を区別してください。

1. AppStore から app server への Function call は `x-signature` で認証します。
2. App server から Channel への native call は app/channel token で認可します。
3. WAM の manager/user native call は Channel host runtime が提供する authorization で実行します。

TypeScript の `NativeFunctionClient.createProxyApi(accessToken)` は typed Channel operation を提供します。Go に同じ wrapper があると仮定せず、[Go feature parity](../../reference/go-feature-parity.md) を確認してください。

## 6. WAM

```bash
npm install @channel.io/app-sdk-wam@0.17.2 @channel.io/app-sdk-wam-ui@0.4.0 @channel.io/bezier-react@4.0.0-next.13 @channel.io/bezier-icons@0.60.0 styled-components@^6
```

`@channel.io/app-sdk-wam-ui` は WAM 専用 theme、header、state、dialog、bottom sheet、高さ同期に使います。一般的な UI control は `@channel.io/bezier-react/beta` から直接 import してください。Bezier React 4 はまだ prerelease なので、tutorial と同じ正確な version を固定します。

```tsx
ReactDOM.createRoot(document.getElementById("root")!).render(
  <WamProvider>
    <App />
  </WamProvider>,
);
```

独自の `window.ChannelIOWam` wrapper ではなく SDK hook を使います。

```tsx
const appId = useTypedWamData("appId") ?? "";
const { setSize } = useWamSize();
const { close } = useWamClose();
const { call: callApp } = useCallFunction({ appId, name: "tutorial.save" });
const { call: callNative } = useNativeFunction({
  name: "writeGroupMessageAsManager",
});
```

Server は `type: "wam"` と `appId`、`name`、最小限の `wamArgs` を attributes に入れて返します。Build 済み SPA を `${WAM_ENDPOINT}/${name}` で serve してください。

- `useCallFunction` は AppStore を通じて自分の app server Function を呼びます。Business logic と app/bot 主体の処理に使います。
- `useNativeFunction` は現在の Channel surface が許可した manager/user 主体の Channel native Function を呼びます。
- `useWamData` で読む runtime value と `wamArgs` は client data です。Secret、token、生の customer data を渡さないでください。
- WAM code で App Secret、Signing Key、app token、channel token を発行・保存しないでください。

## 7. Endpoint 設定

Host が `https://example.ngrok.app` の場合:

| Developer portal setting | 値                                       |
| ------------------------ | ---------------------------------------- |
| Function Endpoint        | `https://example.ngrok.app/functions`    |
| WAM Endpoint             | `https://example.ngrok.app/resource/wam` |

Versioned call は `/functions/v1` を使います。`systemVersion` を持たない caller は
`/functions` を呼ぶことがあり、deployment ingress は同じ default-version SDK handler に
接続する必要があります。WAM は `/resource/wam/tutorial` で提供します。対象環境が別の値を
明示しない限り、SDK default AppStore URL `https://app-store.channel.io` を使ってください。

## 8. Test と release

Install 前:

1. SDK test helper または Go app registry で handler を unit test します。
2. Clean install から server と WAM を build します。
3. Signature がない、または誤った request が reject されることを確認します。
4. HTTPS tunnel で local server を公開します。
5. Developer portal に endpoint root と permission を設定します。
6. Test channel に private app を install します。
7. Extension registration、command discovery、WAM load、app/native call、error state を確認します。

Production 前:

- 複数 replica では shared token cache を使います。
- Secret、access token、refresh token、credential を log に出しません。
- 安定した public HTTPS host と health check を用意します。
- SDK version を明示的に固定し、upgrade 前に release note を確認します。
- すべての Function input を validate し、structured error を返します。
- App Secret と Signing Key を secret manager に保存します。

## 参考資料と例

- [旧 Getting Started](https://developers.channel.io/ko/articles/%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-%ED%8A%9C%ED%86%A0%EB%A6%AC%EC%96%BC-516161ed)
- [Authentication](https://developers.channel.io/ko/articles/e7c2fb6f)
- [Function](https://developers.channel.io/ko/articles/77250b17)
- [Command](https://developers.channel.io/ko/articles/b3d200dc)
- [WAM](https://developers.channel.io/ko/articles/059680de)
- [TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts)
- [Go tutorial](https://github.com/channel-io/app-tutorial)
