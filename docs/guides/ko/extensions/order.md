# Order 확장 (레거시)

> **마이그레이션 이후 제거 예정**: `order` extension(`extension.order.*`)은 레거시입니다. `id` 기반으로 재설계된 [Commerce 확장](commerce.md)이 이를 대체하며, 모든 앱이 `commerce`로 이전을 마치면 `order` extension은 제거됩니다. **신규 개발은 `commerce`를 사용하세요.**

기존 `order` extension은 `createdAt` 기반 `Order` 모델과 `extension.order.*` 함수(주문 조회 + 취소/반품/교환 등 클레임 액션)를 제공합니다.

Legacy Function:

- `extension.order.core.getAppConfigs`
- `extension.order.core.getOrders`
- `extension.order.cancel.cancelOrder`
- `extension.order.return.returnOrder`
- `extension.order.exchange.exchangeOrder`
- `extension.order.exchange.getExchangeableItems`
- `extension.order.edit.changeShippingAddress`

`commerce`는 이를 재설계한 확장으로, 주요 차이는 다음과 같습니다.

- `buyer` 필드 추가
- `createdAt` → `orderedAt`
- 액션 응답을 `ActionResult`로 래핑
- `returnAcceptOrder`(반품 수거 완료) 함수 추가

전체 함수 목록과 사용법은 [Commerce 확장](commerce.md)을 참고하세요.

## TypeScript

TypeScript 기존 앱은 `@Extension({ name: "order", systemVersion: "v1" })`과
`OrderExtensionInterface`를 유지할 수 있습니다. 이름 있는 Function-level schema가 export되지 않으면
전체 Function 이름을 [canonical schema registry](../../../reference/typescript/EXTENSIONS.md#canonical-schema-registry)에서
해결합니다.

## Go

```go
err := app.Use(order.Extension().
  GetAppConfigs(handler.GetAppConfigs).
  GetOrders(handler.GetOrders).
  CancelOrder(handler.CancelOrder).
  ReturnOrder(handler.ReturnOrder).
  ExchangeOrder(handler.ExchangeOrder).
  GetExchangeableItems(handler.GetExchangeableItems).
  ChangeShippingAddress(handler.ChangeShippingAddress))
```

Commerce에 같은 Function이 있다면 legacy model에 새 기능을 추가하지 않습니다.

## 마이그레이션·검증 체크리스트

1. 안정적인 provider order ID와 `orderedAt`을 mapping하고 timestamp로 identity를 만들지 않습니다.
2. Buyer와 `ActionResult` mapping을 추가해 Order와 Commerce를 병행합니다.
3. 설치된 안전한 앱에서 lookup과 mutation 결과 및 duplicate delivery를 비교합니다.
4. Registration과 consumer를 Commerce로 옮긴 뒤 모든 설치가 이전되고 rollback이 필요 없을 때만
   Order를 제거합니다.

Provider credential은 server에 두고 legacy/new mutation 모두 idempotent하게 만듭니다.
