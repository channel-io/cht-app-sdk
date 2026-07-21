# 旧 Web ドキュメントとの差分

2026-07-21 に App category と子記事を現在の SDK と比較しました。旧 Web 記事は product concept と wire protocol の理解には有用ですが、実装の source of truth は SDK と最新 tutorial です。

| 旧記事/tutorial                                                   | 現在の推奨                                                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `issueToken` を直接呼び、access/refresh token と TTL を保存       | TypeScript/Go `TokenManager` が cache、早期 refresh、concurrent request deduplication を処理                                          |
| Startup 時に app token で `registerCommands` を 1 回呼ぶ          | `command` extension と `extension.command.metadata.getCommands` を宣言し、`registerExtension` で auto-register                        |
| Version なしの `PUT /functions` を実装                            | SDK server の `PUT /functions/:version` を使用し、portal には `/functions` root を登録                                                |
| Request を parse し `method` switch で dispatch                   | Decorator/builder で typed function を登録し、SDK が dispatch と schema discovery を担当                                              |
| Tutorial ごとに HMAC 比較を直接実装                               | SDK signature guard/server option を使い、正確な raw request bytes を保持                                                             |
| 独自 `window.ChannelIOWam` wrapper を作成                         | `WamProvider` と WAM hooks を使用                                                                                                     |
| 一部例で command value を `params.inputs` から読む                | 現在は `params.input`。同じ params に `chat`、`trigger`、optional `language` がある                                                   |
| Go 1.21 と独自 Fx/token/cache stack                               | Go 1.25 と SDK `v0.13.14`; 最新 tutorial は SDK registry、command builder、token manager、server、signature、auto-registration を使用 |
| Raw Axios/Resty client を中心に設計                               | SDK helper を優先し、言語 parity にない機能のみ小さな adapter に隔離                                                                  |
| AppStore URL を app code に固定                                   | `APP_STORE_URL` が提供された場合は優先し、standalone app のみ SDK default を使って managed runtime URL はコピーしない                 |
| Project generator の開発専用 WAM transport を production で再利用 | Channel client の WAM は public `@channel.io/app-sdk-wam` hook を使い、local preview の動作が production host と異なる点に注意する    |
| 古い manual protocol handler への GitHub link                     | 最新 TypeScript/Go tutorial README と SDK guide を参照                                                                                |

この確認で修正した SDK 文書の誤り:

- Public TypeScript handler context は `FunctionContext` ではなく `Context` です。
- `TokenManager` の scope は app と channel で、manager/user token 発行 API はありません。
- Function route は `POST /functions` ではなく `PUT /functions/:version` です。
- Go quickstart は `v0.8.3` ではなく現在の `v0.13.14` を使います。

Extension registration、endpoint version、token scope、Go native client parity が変わったら再確認してください。
