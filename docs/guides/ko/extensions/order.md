# Order 확장 (레거시)

> **마이그레이션 이후 제거 예정**: `order` extension(`extension.order.*`)은 레거시입니다. `id` 기반으로 재설계된 [Commerce 확장](commerce.md)이 이를 대체하며, 모든 앱이 `commerce`로 이전을 마치면 `order` extension은 제거됩니다. **신규 개발은 `commerce`를 사용하세요.**

기존 `order` extension은 `createdAt` 기반 `Order` 모델과 `extension.order.*` 함수(주문 조회 + 취소/반품/교환 등 클레임 액션)를 제공합니다.

`commerce`는 이를 재설계한 확장으로, 주요 차이는 다음과 같습니다.

- `buyer` 필드 추가
- `createdAt` → `orderedAt`
- 액션 응답을 `ActionResult`로 래핑
- `returnAcceptOrder`(반품 수거 완료) 함수 추가

전체 함수 목록과 사용법은 [Commerce 확장](commerce.md)을 참고하세요.
