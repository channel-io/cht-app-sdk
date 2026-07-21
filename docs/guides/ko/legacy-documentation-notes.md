# 기존 웹 문서 변경 사항

2026-07-21에 App 카테고리와 하위 문서를 현재 SDK와 대조했습니다. 기존 웹 문서는 제품 개념과 wire protocol을 이해하는 데 유용하지만 구현 기준은 SDK와 최신 튜토리얼입니다.

| 기존 문서/튜토리얼 안내                                        | 현재 권장 방식                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `issueToken`을 직접 호출하고 access/refresh token과 TTL을 저장 | TypeScript/Go `TokenManager`가 cache, 사전 refresh, 동시 요청 deduplication을 처리                                        |
| 시작할 때 app token으로 `registerCommands` 1회 호출            | `command` extension과 `extension.command.metadata.getCommands`를 선언하고 `registerExtension`으로 자동 등록               |
| Version이 없는 `PUT /functions` 하나 구현                      | SDK server의 `PUT /functions/:version` 사용, 포털에는 `/functions` root 등록                                              |
| 요청을 직접 parse하고 `method` switch로 dispatch               | Decorator/builder로 typed function 등록, SDK가 dispatch와 schema discovery 처리                                           |
| 각 튜토리얼에서 HMAC 비교 직접 구현                            | SDK signature guard/server option 사용, 정확한 raw request bytes 보존                                                     |
| `window.ChannelIOWam` 자체 wrapper 작성                        | `WamProvider`, `useWamData`, `useCallFunction`, `useNativeFunction`, `useWamSize`, `useWamClose` 사용                     |
| 일부 예제에서 command 값을 `params.inputs`로 읽음              | 현재 command input은 `params.input`; 같은 위치에 `chat`, `trigger`, optional `language`가 있음                            |
| Go 1.21과 자체 Fx/token/cache stack 사용                       | Go 1.25와 SDK `v0.13.14`; 최신 튜토리얼은 SDK registry, command builder, token manager, server, 서명 검증, 자동 등록 사용 |
| Raw Axios/Resty client를 기본 구조로 사용                      | SDK helper를 먼저 사용하고 언어별 parity에 없는 기능만 작은 adapter로 격리                                                |
| AppStore URL을 코드에 고정                                     | `APP_STORE_URL`이 제공되면 우선 사용; 독립 앱만 SDK 기본값을 사용하고 managed runtime URL을 복사하지 않음                 |
| 프로젝트 생성기의 개발 전용 WAM transport를 운영 코드에 재사용 | Channel client용 WAM은 공개 `@channel.io/app-sdk-wam` hook을 사용하며 local preview 동작은 운영 host와 다를 수 있음       |
| 수동 protocol handler를 가리키는 오래된 GitHub 링크 사용       | 최신 TypeScript/Go 튜토리얼 README와 SDK 가이드 사용                                                                      |

이번 검토에서 함께 수정한 SDK 문서 오류:

- 공개 TypeScript handler context는 `FunctionContext`가 아니라 `Context`입니다.
- `TokenManager`가 관리하는 scope는 app과 channel이며 manager/user token 발급 API는 없습니다.
- Function route는 `POST /functions`가 아니라 `PUT /functions/:version`입니다.
- Go quickstart 버전은 `v0.8.3`이 아니라 현재 `v0.13.14`입니다.

Extension 등록, endpoint version, token scope, Go native client parity가 바뀔 때 이 문서를 다시 검토하세요.
