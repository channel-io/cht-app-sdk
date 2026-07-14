# Channel App SDK 가이드

이 가이드는 Channel 앱 개발자가 TypeScript SDK와 Go SDK를 같은 개념으로 사용할 수 있도록 정리합니다.

## 문서

- [빠른 시작](quickstart.md)
- [핵심 개념](concepts.md)
- [함수 등록](functions.md)
- [부분 마이그레이션](partial-migration.md)
- [WMS 확장](extensions/wms.md)
- [Order 확장 (레거시)](extensions/order.md)
- [Commerce 확장](extensions/commerce.md)

## 선택 기준

TypeScript SDK는 NestJS, Zod, WAM React 개발에 적합합니다. Go SDK는 기존 Go 서비스에서 typed function, native client, extension helper를 점진적으로 도입할 때 적합합니다.
