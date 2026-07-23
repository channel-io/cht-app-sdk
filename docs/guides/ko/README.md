# Channel App SDK 가이드

이 가이드는 Channel 앱 개발자가 TypeScript SDK와 Go SDK를 같은 개념으로 사용할 수 있도록 정리합니다.

## 문서

- [핵심 개념](concepts.md)
- [빠른 시작](quickstart.md)
- [앱 개발 전체 가이드](app-development.md)
- [함수 등록](functions.md)
- [Extension 전체 가이드와 16개 TypeScript/Go 상세 문서](extensions.md)

## 선택 기준

TypeScript SDK는 NestJS, Zod, WAM React 개발에 적합합니다. Go SDK는 Go 서비스에서 typed
function, native client, extension helper를 사용할 때 적합합니다.

웹 문서, 튜토리얼, SDK 예제가 서로 다르면 공개 SDK export를 먼저 따르고 SDK 레퍼런스와 최신 튜토리얼을 차례로 확인하세요.

## 실행 예제

- [TypeScript 앱 튜토리얼](https://github.com/channel-io/app-tutorial-ts)
- [Go 앱 튜토리얼](https://github.com/channel-io/app-tutorial)

## 언어별 레퍼런스

- [TypeScript 아키텍처](../../reference/typescript/ARCHITECTURE.md), [인증과 토큰](../../reference/typescript/AUTH-AND-TOKENS.md), [Extension](../../reference/typescript/EXTENSIONS.md), [WAM](../../reference/typescript/WAM.md)
- [Go 레퍼런스](../../reference/go/README.md): Function, 서버, 인증과 토큰, Extension, native Function, WAM 연동
